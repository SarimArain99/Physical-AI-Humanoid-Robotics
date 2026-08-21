---
sidebar_position: 2
title: Sensor Systems
---

# Sensor Systems for Physical AI

*Weeks 1–2: LIDAR, Cameras, IMUs, and Force/Torque Sensors*

---

## Overview

Sensors are the **eyes, ears, and sense of touch** of a robot. Without sensors, a robot is blind — it cannot perceive obstacles, recognize objects, or understand its own position in space. In this chapter, we explore the primary sensor modalities used in humanoid robotics.

---

## Vision Sensors

### RGB Cameras

Standard color cameras provide 2D image data. In robotics, they're used for:

- **Object detection and recognition** (YOLO, SSD, Faster R-CNN)
- **Face recognition** for human-robot interaction
- **Visual servoing** — using visual feedback to guide robot motion
- **Scene understanding** and semantic segmentation

```python
import cv2

# Basic camera capture for robotics
cap = cv2.VideoCapture(0)  # Open default camera

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # Process frame for object detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Display
    cv2.imshow('Robot Vision', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

### Depth Cameras

Depth cameras provide **per-pixel distance measurements**, creating a 3D understanding of the scene.

#### Types of Depth Sensing

| Technology | How It Works | Pros | Cons |
|-----------|-------------|------|------|
| **Stereo Vision** | Two cameras, triangulation | Passive, works outdoors | Requires texture, less accurate |
| **Structured Light** | Projects IR pattern, measures distortion | Very accurate indoors | Fails in sunlight |
| **Time-of-Flight (ToF)** | Measures light travel time | Works in all lighting | Lower resolution |

**Recommended Hardware:** Intel RealSense D435i — combines RGB, depth, and IMU in one unit.

```python
import pyrealsense2 as rs
import numpy as np

# Configure RealSense pipeline
pipeline = rs.pipeline()
config = rs.config()
config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)

pipeline.start(config)

try:
    frames = pipeline.wait_for_frames()
    depth_frame = frames.get_depth_frame()
    color_frame = frames.get_color_frame()
    
    # Convert to numpy arrays
    depth_image = np.asanyarray(depth_frame.get_data())
    color_image = np.asanyarray(color_frame.get_data())
    
    # Get distance at center pixel
    center_distance = depth_frame.get_distance(320, 240)
    print(f"Distance at center: {center_distance:.2f} meters")
finally:
    pipeline.stop()
```

---

## LiDAR (Light Detection and Ranging)

LiDAR sensors emit **laser pulses** and measure the time it takes for them to bounce back, creating precise 3D point clouds of the environment.

### How LiDAR Works

```
        Laser Pulse →  ·  ·  ·  ·  ·  · → Object
Robot ◄──────────────────────────────────── Reflection
        
Time = 2 × Distance / Speed of Light
Distance = (Time × c) / 2
```

### Types of LiDAR

- **2D LiDAR:** Scans in a single plane (like a radar sweep). Used for basic obstacle avoidance and mapping.
- **3D LiDAR:** Scans in multiple planes, creating a full 3D point cloud. Used in autonomous vehicles and advanced robotics.

### Applications in Humanoid Robotics

1. **SLAM (Simultaneous Localization and Mapping):** Building a map while tracking the robot's position
2. **Obstacle Detection:** Real-time avoidance of static and dynamic obstacles
3. **Terrain Analysis:** Understanding ground surface for bipedal walking

---

## Inertial Measurement Units (IMUs)

An IMU combines multiple sensors to measure a body's **orientation, angular velocity, and linear acceleration**.

### IMU Components

| Component | Measures | Units |
|-----------|----------|-------|
| **Accelerometer** | Linear acceleration | m/s² |
| **Gyroscope** | Angular velocity | rad/s |
| **Magnetometer** | Magnetic field (compass) | µT |

### Why IMUs Matter for Humanoids

For a bipedal robot, balance is everything. The IMU acts as the robot's **inner ear** — providing:

- **Balance feedback** — detecting tilt and angular velocity
- **Step detection** — counting steps and measuring gait
- **Fall prevention** — rapid response to unexpected disturbances

```python
# Reading IMU data (conceptual example)
class IMUReader:
    def __init__(self):
        self.acceleration = [0.0, 0.0, 9.81]  # x, y, z (gravity on z)
        self.gyroscope = [0.0, 0.0, 0.0]       # roll, pitch, yaw rates
    
    def get_orientation(self):
        """Fuse accelerometer and gyroscope data for orientation."""
        # Complementary filter (simplified)
        alpha = 0.98
        accel_angle = self._accel_to_angle(self.acceleration)
        gyro_angle = self._integrate_gyro(self.gyroscope)
        
        # Combine: trust gyro for short-term, accel for long-term
        fused_angle = alpha * gyro_angle + (1 - alpha) * accel_angle
        return fused_angle
    
    def is_falling(self):
        """Detect if the robot is in free-fall."""
        total_accel = sum(a**2 for a in self.acceleration) ** 0.5
        return total_accel < 1.0  # Much less than gravity = falling
```

---

## Force/Torque Sensors

Force/torque (F/T) sensors measure the **forces and torques** applied at a specific point, typically at the robot's wrist or feet.

### Applications

- **Grasping:** Detecting grip force to avoid crushing objects or dropping them
- **Ground Reaction Forces:** Measuring contact forces during walking
- **Collision Detection:** Sensing unexpected contacts for safety
- **Compliant Manipulation:** Adjusting force in real-time during assembly tasks

### Six-Axis F/T Sensor

A six-axis sensor measures:
- **Fx, Fy, Fz:** Forces in three directions
- **Tx, Ty, Tz:** Torques (rotational forces) around three axes

---

## Sensor Fusion

In practice, robots don't rely on a single sensor. **Sensor fusion** combines data from multiple sensors to create a more accurate and robust understanding of the world.

### Common Fusion Approaches

1. **Kalman Filter:** Optimal estimation combining predictions with noisy measurements
2. **Extended Kalman Filter (EKF):** Handles nonlinear systems (common in robotics)
3. **Particle Filter:** Monte Carlo approach for highly nonlinear, non-Gaussian problems

```
                    ┌──────────┐
    Camera ────────►│          │
    LiDAR  ────────►│  Sensor  │────► Unified World Model
    IMU    ────────►│  Fusion  │      (Pose + Map + Objects)
    F/T    ────────►│          │
                    └──────────┘
```

---

## Summary

| Sensor | Primary Use | Key Metric |
|--------|-----------|------------|
| RGB Camera | Object recognition, visual servoing | Resolution (megapixels) |
| Depth Camera | 3D perception, point clouds | Depth accuracy (mm) |
| LiDAR | Mapping, obstacle avoidance | Range (meters), points/sec |
| IMU | Balance, orientation | Drift rate (°/hour) |
| Force/Torque | Grasping, contact detection | Sensitivity (N, Nm) |

---

## Exercises

1. **Hands-On:** If you have an Intel RealSense camera, capture depth images and visualize them using OpenCV's colormap.
2. **Research:** Compare the specifications of three LiDAR sensors suitable for indoor robots. Which would you choose and why?
3. **Think:** Why is sensor fusion critical for a walking humanoid? What happens if the IMU fails?

---

*Next: [ROS 2 Architecture →](./ros2-architecture)*

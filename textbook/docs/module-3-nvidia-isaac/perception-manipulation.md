---
sidebar_position: 2
title: AI-Powered Perception
---

# AI-Powered Perception and Manipulation

*Weeks 8–10: Computer Vision, SLAM, and Object Manipulation*

---

## Perception Pipeline

A robot's perception pipeline transforms raw sensor data into actionable understanding:

```
Raw Sensors → Preprocessing → Detection → Tracking → World Model
  (RGB/D)      (Denoise,       (YOLO,      (DeepSORT,  (Semantic
               Rectify)        SegFormer)   ByteTrack)   Map)
```

---

## Object Detection with Isaac ROS

Isaac ROS provides **GPU-accelerated** perception nodes:

### DNN Inference Node

```python
# Launch Isaac ROS object detection
# Uses TensorRT-optimized models for real-time inference
"""
ros2 launch isaac_ros_yolov8 isaac_ros_yolov8_visualize.launch.py \
    model_file_path:=/models/yolov8n.onnx \
    engine_file_path:=/models/yolov8n.plan \
    input_image_width:=640 \
    input_image_height:=480 \
    confidence_threshold:=0.5
"""
```

### Performance Comparison

| Model | CPU (FPS) | GPU w/ TensorRT (FPS) | Speedup |
|-------|-----------|----------------------|---------|
| YOLOv8n | 15 | 120+ | 8× |
| SSD MobileNet | 20 | 150+ | 7.5× |
| SegFormer | 5 | 60+ | 12× |

---

## Visual SLAM (VSLAM)

**SLAM** — Simultaneous Localization and Mapping — is the ability to build a map of the environment while simultaneously tracking the robot's position within it.

### Isaac ROS Visual SLAM

Isaac ROS provides hardware-accelerated **cuVSLAM**:

```bash
# Launch VSLAM with stereo camera input
ros2 launch isaac_ros_visual_slam isaac_ros_visual_slam.launch.py \
    enable_slam_visualization:=true \
    enable_observations_view:=true \
    enable_landmarks_view:=true
```

### SLAM Output

```
Input: Stereo camera images (30 FPS)
       ↓
┌─────────────────────────────┐
│ cuVSLAM (GPU-accelerated)   │
│  - Feature extraction        │
│  - Feature matching          │
│  - Pose estimation           │
│  - Loop closure detection    │
│  - Map optimization          │
└──────────┬──────────────────┘
           ↓
Output: Robot pose (x, y, z, roll, pitch, yaw)
        3D point cloud map
        Occupancy grid (for navigation)
```

---

## Depth Estimation

For robots with only monocular cameras, Isaac ROS provides GPU-accelerated depth estimation:

```bash
# Mono depth estimation using ESS model
ros2 launch isaac_ros_ess isaac_ros_ess.launch.py \
    engine_file_path:=/models/ess.engine \
    threshold:=0.35
```

### Point Cloud Generation

Convert depth images to 3D point clouds for spatial reasoning:

```python
import numpy as np

def depth_to_pointcloud(depth_image, camera_intrinsics):
    """Convert depth image to 3D point cloud."""
    fx, fy = camera_intrinsics['fx'], camera_intrinsics['fy']
    cx, cy = camera_intrinsics['cx'], camera_intrinsics['cy']
    
    height, width = depth_image.shape
    u, v = np.meshgrid(np.arange(width), np.arange(height))
    
    z = depth_image
    x = (u - cx) * z / fx
    y = (v - cy) * z / fy
    
    points = np.stack([x, y, z], axis=-1)
    valid = z > 0
    return points[valid]
```

---

## Object Manipulation

### Grasp Planning

```python
class GraspPlanner:
    def plan_grasp(self, point_cloud, object_mask):
        """
        Plan a grasp for a detected object.
        
        Steps:
        1. Segment the object point cloud
        2. Estimate object pose and geometry
        3. Generate candidate grasps
        4. Score and rank grasps
        5. Return the best feasible grasp
        """
        object_points = point_cloud[object_mask]
        centroid = np.mean(object_points, axis=0)
        
        # Generate antipodal grasp candidates
        candidates = self.generate_antipodal_grasps(
            object_points, num_candidates=100)
        
        # Score each candidate
        scored = [(g, self.score_grasp(g, object_points)) 
                  for g in candidates]
        scored.sort(key=lambda x: x[1], reverse=True)
        
        return scored[0][0]  # Best grasp
```

---

## Summary

- Isaac ROS provides GPU-accelerated perception achieving 8–12× speedups
- cuVSLAM enables real-time visual SLAM on Jetson hardware
- Depth estimation from monocular cameras enables 3D reasoning
- Grasp planning combines perception with motion planning for manipulation

---

*Next: [Reinforcement Learning for Robot Control →](./reinforcement-learning)*

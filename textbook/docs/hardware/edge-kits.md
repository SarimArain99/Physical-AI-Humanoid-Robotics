---
sidebar_position: 2
title: Edge Computing Kits
---

# The "Physical AI" Edge Kit

Since a full humanoid robot is expensive, students learn Physical AI by setting up the *nervous system* on a desk before deploying it to a robot.

---

## The Economy Jetson Student Kit

| Component | Model | Price (Approx.) | Notes |
|-----------|-------|-----------------|-------|
| **The Brain** | NVIDIA Jetson Orin Nano Super Dev Kit (8GB) | $249 | 40 TOPS AI performance |
| **The Eyes** | Intel RealSense D435i | $349 | RGB + Depth + IMU |
| **The Ears** | ReSpeaker USB Mic Array v2.0 | $69 | Far-field microphone for voice |
| **Wi-Fi** | (Included in Dev Kit) | $0 | Pre-installed in "Super" kit |
| **Power/Misc** | SD Card (128GB) + Jumper Wires | $30 | High-endurance microSD |
| **TOTAL** | | **~$700 per kit** | |

:::tip Buy the D435**i** (not D435)
The "i" variant includes a built-in IMU, which is essential for SLAM applications. The non-i version requires a separate IMU sensor.
:::

---

## Jetson Setup

```bash
# Flash JetPack 6.x to microSD
# Download SDK Manager from developer.nvidia.com

# After boot, install ROS 2
sudo apt install ros-humble-ros-base

# Install Isaac ROS
mkdir -p ~/workspaces/isaac_ros/src
cd ~/workspaces/isaac_ros/src
git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_common.git

# Install RealSense SDK
sudo apt install ros-humble-librealsense2 ros-humble-realsense2-camera

# Test camera
ros2 launch realsense2_camera rs_launch.py depth_module.profile:=640x480x30
```

---

## Role in the Course

| Module | Jetson Kit Usage |
|--------|------------------|
| **Module 1** | Run ROS 2 nodes, understand resource constraints |
| **Module 2** | N/A (simulation runs on workstation) |
| **Module 3** | Deploy Isaac ROS perception, run VSLAM |
| **Module 4** | Run Whisper inference, edge deployment of trained policies |

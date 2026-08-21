---
sidebar_position: 1
title: Gazebo Simulation Setup
---

# Gazebo Simulation Environment

*Weeks 6–7: Physics Simulation and Environment Building*

---

## Why Simulate?

Training robots in the real world is **expensive, slow, and dangerous**. A robot learning to walk will fall thousands of times. In simulation, those falls cost nothing. Simulation provides:

- **Safety** — No risk of damaging expensive hardware
- **Speed** — Run thousands of experiments in parallel, faster than real-time
- **Reproducibility** — Exact same conditions for every experiment
- **Scalability** — Spin up hundreds of robots simultaneously
- **Data generation** — Create labeled training data automatically

---

## Gazebo Overview

**Gazebo** is the most widely-used open-source robot simulator in the ROS ecosystem. It provides:

- **Physics engines** (ODE, Bullet, DART, Simbody) for realistic dynamics
- **Sensor simulation** (cameras, LiDAR, IMU, force/torque)
- **ROS 2 integration** via `gazebo_ros` packages
- **SDF (Simulation Description Format)** for world and model files
- **Plugin architecture** for custom behaviors

### Installing Gazebo

```bash
# Install Gazebo Harmonic (recommended for ROS 2 Humble)
sudo apt-get update
sudo apt-get install ros-humble-ros-gz

# Verify installation
gz sim --version
```

---

## World Files (SDF)

A **world file** defines the simulated environment — ground planes, lighting, objects, and physics settings.

```xml
<?xml version="1.0"?>
<sdf version="1.8">
  <world name="humanoid_lab">
    <!-- Physics Configuration -->
    <physics type="ode">
      <max_step_size>0.001</max_step_size>
      <real_time_factor>1.0</real_time_factor>
    </physics>

    <!-- Lighting -->
    <light type="directional" name="sun">
      <cast_shadows>true</cast_shadows>
      <pose>0 0 10 0 0 0</pose>
      <diffuse>0.8 0.8 0.8 1</diffuse>
    </light>

    <!-- Ground Plane -->
    <model name="ground_plane">
      <static>true</static>
      <link name="link">
        <collision name="collision">
          <geometry><plane><normal>0 0 1</normal></plane></geometry>
        </collision>
        <visual name="visual">
          <geometry><plane><normal>0 0 1</normal><size>50 50</size></plane></geometry>
          <material>
            <ambient>0.3 0.3 0.3 1</ambient>
          </material>
        </visual>
      </link>
    </model>

    <!-- Table with objects for manipulation tasks -->
    <model name="table">
      <static>true</static>
      <pose>1.5 0 0 0 0 0</pose>
      <link name="link">
        <collision name="collision">
          <geometry><box><size>1.0 0.6 0.75</size></box></geometry>
        </collision>
        <visual name="visual">
          <geometry><box><size>1.0 0.6 0.75</size></box></geometry>
          <material><ambient>0.6 0.4 0.2 1</ambient></material>
        </visual>
      </link>
    </model>
  </world>
</sdf>
```

---

## Spawning a Robot

Use a ROS 2 launch file to spawn your URDF robot into Gazebo:

```python
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch_ros.actions import Node
import os
from ament_index_python.packages import get_package_share_directory

def generate_launch_description():
    pkg_dir = get_package_share_directory('my_humanoid_pkg')
    
    # Start Gazebo
    gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(get_package_share_directory('ros_gz_sim'),
                        'launch', 'gz_sim.launch.py')
        ),
        launch_arguments={'gz_args': 'humanoid_lab.sdf'}.items()
    )
    
    # Spawn robot from URDF
    spawn_robot = Node(
        package='ros_gz_sim',
        executable='create',
        arguments=[
            '-name', 'humanoid',
            '-file', os.path.join(pkg_dir, 'urdf', 'humanoid.urdf'),
            '-x', '0', '-y', '0', '-z', '1.0'
        ],
    )
    
    return LaunchDescription([gazebo, spawn_robot])
```

---

## Physics Simulation

### Key Physics Parameters

| Parameter | Description | Typical Value |
|-----------|-------------|---------------|
| **Step size** | Time per physics step | 0.001s (1000Hz) |
| **Real-time factor** | Sim speed vs. real time | 1.0 (real-time) |
| **Gravity** | Gravitational acceleration | -9.81 m/s² |
| **Friction** | Surface friction coefficients | μ = 0.5–1.0 |
| **Solver iterations** | Constraint solver accuracy | 50–100 |

### Contact and Collision

Gazebo handles collisions between objects using contact models:

```xml
<collision name="foot_collision">
  <geometry><box><size>0.2 0.1 0.03</size></box></geometry>
  <surface>
    <friction>
      <ode>
        <mu>0.8</mu>      <!-- Static friction -->
        <mu2>0.6</mu2>    <!-- Dynamic friction -->
      </ode>
    </friction>
    <contact>
      <ode>
        <kp>1e6</kp>      <!-- Contact stiffness -->
        <kd>100</kd>       <!-- Contact damping -->
      </ode>
    </contact>
  </surface>
</collision>
```

---

## ROS 2 — Gazebo Bridge

The `ros_gz_bridge` connects Gazebo topics to ROS 2 topics:

```bash
# Bridge camera images
ros2 run ros_gz_bridge parameter_bridge \
  /camera@sensor_msgs/msg/Image@gz.msgs.Image

# Bridge IMU data
ros2 run ros_gz_bridge parameter_bridge \
  /imu@sensor_msgs/msg/Imu@gz.msgs.IMU

# Bridge joint commands
ros2 run ros_gz_bridge parameter_bridge \
  /joint_commands@std_msgs/msg/Float64MultiArray@gz.msgs.Double_V
```

---

## Summary

- **Gazebo** provides physics-accurate simulation with full ROS 2 integration
- **SDF world files** define environments with physics, lighting, and objects
- **Robot spawning** uses URDF via launch files
- **Physics parameters** control simulation fidelity (step size, friction, contacts)
- **ROS bridge** connects Gazebo and ROS 2 message streams

---

*Next: [URDF and SDF Formats →](./urdf-sdf-formats)*

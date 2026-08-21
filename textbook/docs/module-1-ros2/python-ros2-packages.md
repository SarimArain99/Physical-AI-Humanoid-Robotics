---
sidebar_position: 5
title: Building ROS 2 Packages
---

# Building ROS 2 Packages with Python

*Weeks 3–5: Package Structure, Launch Files, and Parameter Management*

---

## ROS 2 Package Structure

A ROS 2 Python package follows a standard layout:

```
my_humanoid_pkg/
├── package.xml              # Package metadata and dependencies
├── setup.py                 # Python package configuration
├── setup.cfg                # Entry point configuration
├── resource/
│   └── my_humanoid_pkg      # Marker file for ament
├── my_humanoid_pkg/
│   ├── __init__.py
│   ├── camera_node.py       # Camera driver node
│   ├── detector_node.py     # Object detection node
│   └── controller_node.py   # Motor controller node
├── launch/
│   └── humanoid_launch.py   # Launch file
├── config/
│   └── params.yaml          # Parameter file
└── test/
    ├── test_camera.py
    └── test_detector.py
```

### Creating a Package

```bash
cd ~/ros2_ws/src
ros2 pkg create --build-type ament_python my_humanoid_pkg \
  --dependencies rclpy std_msgs sensor_msgs geometry_msgs
```

### package.xml

```xml
<?xml version="1.0"?>
<package format="3">
  <name>my_humanoid_pkg</name>
  <version>0.1.0</version>
  <description>Humanoid robot control package</description>
  <maintainer email="you@email.com">Your Name</maintainer>
  <license>MIT</license>

  <depend>rclpy</depend>
  <depend>std_msgs</depend>
  <depend>sensor_msgs</depend>
  <depend>geometry_msgs</depend>

  <buildtool_depend>ament_python</buildtool_depend>

  <test_depend>ament_copyright</test_depend>
  <test_depend>ament_pep257</test_depend>
  <test_depend>python3-pytest</test_depend>

  <export>
    <build_type>ament_python</build_type>
  </export>
</package>
```

---

## Launch Files

Launch files start **multiple nodes** with a single command — essential when your robot has dozens of nodes.

```python
# launch/humanoid_launch.py
from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration

def generate_launch_description():
    return LaunchDescription([
        DeclareLaunchArgument('robot_name', default_value='atlas'),
        
        Node(
            package='my_humanoid_pkg',
            executable='camera_node',
            name='camera',
            parameters=[{'fps': 30, 'resolution': '640x480'}],
            remappings=[('/image_raw', '/camera/image_raw')],
        ),
        Node(
            package='my_humanoid_pkg',
            executable='detector_node',
            name='detector',
            parameters=[{'model': 'yolov8n', 'confidence': 0.5}],
        ),
        Node(
            package='my_humanoid_pkg',
            executable='controller_node',
            name='controller',
            parameters=[LaunchConfiguration('robot_name')],
        ),
    ])
```

### Running a Launch File

```bash
ros2 launch my_humanoid_pkg humanoid_launch.py robot_name:=optimus
```

---

## Parameter Management

Parameters allow runtime configuration without recompiling:

```yaml
# config/params.yaml
camera_node:
  ros__parameters:
    fps: 30
    resolution: "1280x720"
    auto_exposure: true

detector_node:
  ros__parameters:
    model_path: "/models/yolov8n.pt"
    confidence_threshold: 0.5
    nms_threshold: 0.45
    classes: ["person", "cup", "chair", "door"]

controller_node:
  ros__parameters:
    max_velocity: 1.5        # m/s
    max_angular_velocity: 2.0 # rad/s
    control_frequency: 100    # Hz
```

### Reading Parameters in Code

```python
class DetectorNode(Node):
    def __init__(self):
        super().__init__('detector_node')
        
        # Declare parameters with defaults
        self.declare_parameter('confidence_threshold', 0.5)
        self.declare_parameter('model_path', '/models/yolov8n.pt')
        
        # Read parameter values
        self.confidence = self.get_parameter(
            'confidence_threshold').get_parameter_value().double_value
        self.model_path = self.get_parameter(
            'model_path').get_parameter_value().string_value
        
        self.get_logger().info(
            f'Detector initialized: model={self.model_path}, '
            f'confidence={self.confidence}')
```

---

## Building and Running

```bash
# Build the workspace
cd ~/ros2_ws
colcon build --packages-select my_humanoid_pkg

# Source the workspace
source install/setup.bash

# Run a single node
ros2 run my_humanoid_pkg camera_node

# Run all nodes via launch
ros2 launch my_humanoid_pkg humanoid_launch.py
```

---

## Summary

- ROS 2 packages organize code, configs, and launch files into reusable units
- Launch files orchestrate multiple nodes with parameters and remappings
- YAML parameter files enable runtime configuration
- `colcon build` compiles the workspace; `source install/setup.bash` activates it

---

*Next: [URDF for Humanoids →](./urdf-humanoids)*

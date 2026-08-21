---
sidebar_position: 4
title: Nodes, Topics & Services Deep Dive
---

# Nodes, Topics, and Services — Deep Dive

*Weeks 3–5: Advanced Communication Patterns*

---

## Quality of Service (QoS) Profiles

One of ROS 2's most powerful features is its **QoS (Quality of Service)** system, inherited from DDS. QoS lets you configure how messages are delivered based on your application's needs.

### Key QoS Policies

| Policy | Options | Use Case |
|--------|---------|----------|
| **Reliability** | `RELIABLE` / `BEST_EFFORT` | Sensor data (best effort) vs. commands (reliable) |
| **Durability** | `VOLATILE` / `TRANSIENT_LOCAL` | Late-joining subscribers need history? |
| **History** | `KEEP_LAST(N)` / `KEEP_ALL` | How many messages to buffer |
| **Deadline** | Duration | Maximum time between messages |
| **Liveliness** | `AUTOMATIC` / `MANUAL` | Detect dead nodes |

### Example: Sensor QoS Profile

```python
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy

sensor_qos = QoSProfile(
    reliability=ReliabilityPolicy.BEST_EFFORT,
    history=HistoryPolicy.KEEP_LAST,
    depth=5
)

# Use it in a subscriber
self.subscription = self.create_subscription(
    Image, '/camera/image_raw', self.image_callback, sensor_qos)
```

---

## Custom Message Types

While ROS 2 provides standard messages (`std_msgs`, `sensor_msgs`, `geometry_msgs`), you'll often need **custom messages** for your specific robot.

### Defining a Custom Message

Create a `.msg` file:

```
# HumanoidStatus.msg
# Custom message for humanoid robot status

string robot_name
float64 battery_level          # 0.0 to 1.0
float64[3] center_of_mass      # x, y, z position
float64[6] joint_torques       # 6 primary joints
bool is_balanced
string current_action          # "standing", "walking", "reaching"
uint32 step_count
```

### Using Custom Messages

```python
from my_robot_msgs.msg import HumanoidStatus

class StatusPublisher(Node):
    def __init__(self):
        super().__init__('status_publisher')
        self.publisher = self.create_publisher(
            HumanoidStatus, '/humanoid/status', 10)
    
    def publish_status(self):
        msg = HumanoidStatus()
        msg.robot_name = "Atlas-v2"
        msg.battery_level = 0.87
        msg.center_of_mass = [0.0, 0.0, 0.95]
        msg.is_balanced = True
        msg.current_action = "standing"
        self.publisher.publish(msg)
```

---

## Multi-Node Architectures

Real robots run **dozens of nodes** simultaneously. Here's a typical architecture for a humanoid:

```
┌─────────────────────────────────────────────────────────────┐
│                    Humanoid Robot System                      │
│                                                               │
│  Perception          Planning           Control               │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐         │
│  │ Camera   │──────►│ Object   │       │ Walking  │         │
│  │ Driver   │       │ Detector │       │ Control  │         │
│  └──────────┘       └────┬─────┘       └────▲─────┘         │
│  ┌──────────┐            │                  │                │
│  │ LiDAR    │──────►┌────▼─────┐       ┌────┴─────┐         │
│  │ Driver   │       │ World    │──────►│ Motion   │         │
│  └──────────┘       │ Model    │       │ Planner  │         │
│  ┌──────────┐       └────┬─────┘       └──────────┘         │
│  │ IMU      │──────►┌────▼─────┐       ┌──────────┐         │
│  │ Driver   │       │ SLAM     │       │ Joint    │         │
│  └──────────┘       │ Node     │       │ Servos   │         │
│                     └──────────┘       └──────────┘         │
│                                                               │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐         │
│  │ Voice    │──────►│ NLU /    │──────►│ Task     │         │
│  │ Input    │       │ GPT      │       │ Manager  │         │
│  └──────────┘       └──────────┘       └──────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Lifecycle (Managed) Nodes

ROS 2 introduces **managed nodes** with well-defined state machines — critical for safe robot operation.

### Node States

```
        ┌──────────────┐
        │  Unconfigured │
        └──────┬───────┘
               │ configure()
        ┌──────▼───────┐
        │   Inactive    │
        └──────┬───────┘
               │ activate()
        ┌──────▼───────┐
        │    Active     │ ◄── Normal operation
        └──────┬───────┘
               │ deactivate()
        ┌──────▼───────┐
        │   Inactive    │
        └──────┬───────┘
               │ cleanup()
        ┌──────▼───────┐
        │  Unconfigured │
        └──────┬───────┘
               │ shutdown()
        ┌──────▼───────┐
        │   Finalized   │
        └──────────────┘
```

This is critical for safety: you can **deactivate** motor control nodes without shutting them down, allowing for safe pauses during maintenance or error recovery.

---

## Namespaces and Remapping

For multi-robot systems, namespaces prevent topic name collisions:

```bash
# Robot 1
ros2 run my_robot camera_node --ros-args -r __ns:=/robot1

# Robot 2  
ros2 run my_robot camera_node --ros-args -r __ns:=/robot2

# Result:
# /robot1/camera/image_raw
# /robot2/camera/image_raw
```

---

## Summary

- **QoS profiles** let you tune message delivery for reliability vs. speed
- **Custom messages** define robot-specific data structures
- **Multi-node architectures** distribute computation across specialized processes
- **Lifecycle nodes** provide safe state management for robot hardware
- **Namespaces** enable multi-robot systems

---

*Next: [Building ROS 2 Packages with Python →](./python-ros2-packages)*

---
sidebar_position: 3
title: ROS 2 Architecture
---

# ROS 2 Architecture and Core Concepts

*Weeks 3–5: Understanding the Robot Operating System*

---

## What is ROS 2?

**ROS 2 (Robot Operating System 2)** is not actually an operating system — it's a **middleware framework** that provides tools, libraries, and conventions for building robot software. Think of it as the "nervous system" of a robot: it handles communication between different software components, much like nerves transmit signals between the brain and body parts.

### Why ROS 2 (not ROS 1)?

| Feature | ROS 1 | ROS 2 |
|---------|-------|-------|
| **Real-time support** | ❌ No | ✅ Yes |
| **Multi-robot support** | Limited | ✅ Native |
| **Security** | ❌ None | ✅ DDS Security |
| **OS Support** | Linux only | Linux, Windows, macOS |
| **Communication** | Custom (TCPROS) | DDS Standard |
| **Lifecycle Management** | ❌ No | ✅ Managed nodes |

ROS 2 uses **DDS (Data Distribution Service)** as its communication backbone, providing industrial-grade reliability.

---

## Core Architecture

```
┌──────────────────────────────────────────────────────┐
│                    ROS 2 Graph                        │
│                                                       │
│  ┌──────────┐    Topic     ┌──────────┐              │
│  │  Node A  │──────────────│  Node B  │              │
│  │ (Camera) │  /image_raw  │ (Detect) │              │
│  └──────────┘              └────┬─────┘              │
│                                 │                     │
│                            Topic│/detections          │
│                                 │                     │
│  ┌──────────┐    Service   ┌────▼─────┐              │
│  │  Node C  │◄────────────►│  Node D  │              │
│  │ (Planner)│  /plan_path  │ (Control)│              │
│  └──────────┘              └──────────┘              │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### The ROS 2 Computation Graph

The computation graph is the network of ROS 2 processes (nodes) that communicate with each other. The key building blocks are:

1. **Nodes** — Independent processes that perform computation
2. **Topics** — Named buses for publish/subscribe messaging
3. **Services** — Request/response communication pattern
4. **Actions** — Long-running tasks with feedback
5. **Parameters** — Configuration values for nodes

---

## Nodes

A **node** is a single-purpose process that performs one specific function. Good robotics design follows the Unix philosophy: each node does **one thing well**.

### Examples of Nodes

```
Camera Driver Node → Publishes camera images
Object Detector Node → Detects objects in images  
Path Planner Node → Plans navigation routes
Motor Controller Node → Sends commands to motors
Speech Recognition Node → Processes voice commands
```

### Creating a Node in Python (rclpy)

```python
import rclpy
from rclpy.node import Node

class MinimalNode(Node):
    def __init__(self):
        super().__init__('minimal_node')
        self.get_logger().info('Hello from Physical AI!')
        
        # Create a timer that fires every 1 second
        self.timer = self.create_timer(1.0, self.timer_callback)
        self.counter = 0
    
    def timer_callback(self):
        self.counter += 1
        self.get_logger().info(f'Heartbeat #{self.counter}')

def main(args=None):
    rclpy.init(args=args)
    node = MinimalNode()
    
    try:
        rclpy.spin(node)  # Keep the node running
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

## Topics (Publish/Subscribe)

Topics provide **asynchronous, one-to-many** communication. A publisher sends messages to a topic, and any number of subscribers can receive them.

### Topic Communication Pattern

```
Publisher Node                    Subscriber Node(s)
     │                                │
     │    /camera/image_raw           │
     ├────────────────────────────────►│ Subscriber 1 (Display)
     │                                │
     ├────────────────────────────────►│ Subscriber 2 (Detector)
     │                                │
     └────────────────────────────────►│ Subscriber 3 (Recorder)
```

### Publisher Example

```python
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class MinimalPublisher(Node):
    def __init__(self):
        super().__init__('minimal_publisher')
        self.publisher_ = self.create_publisher(String, 'robot_status', 10)
        self.timer = self.create_timer(0.5, self.timer_callback)
        self.i = 0

    def timer_callback(self):
        msg = String()
        msg.data = f'Status update #{self.i}: All systems nominal'
        self.publisher_.publish(msg)
        self.get_logger().info(f'Publishing: "{msg.data}"')
        self.i += 1

def main(args=None):
    rclpy.init(args=args)
    node = MinimalPublisher()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
```

### Subscriber Example

```python
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class MinimalSubscriber(Node):
    def __init__(self):
        super().__init__('minimal_subscriber')
        self.subscription = self.create_subscription(
            String, 'robot_status', self.listener_callback, 10)

    def listener_callback(self, msg):
        self.get_logger().info(f'Received: "{msg.data}"')

def main(args=None):
    rclpy.init(args=args)
    node = MinimalSubscriber()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
```

---

## Services (Request/Response)

Services provide **synchronous, one-to-one** communication. A client sends a request and waits for a response.

```python
# Service Server
from example_interfaces.srv import AddTwoInts

class AddTwoIntsServer(Node):
    def __init__(self):
        super().__init__('add_two_ints_server')
        self.srv = self.create_service(
            AddTwoInts, 'add_two_ints', self.add_callback)

    def add_callback(self, request, response):
        response.sum = request.a + request.b
        self.get_logger().info(
            f'Request: {request.a} + {request.b} = {response.sum}')
        return response
```

### When to Use Topics vs Services

| Use Case | Topics | Services |
|----------|--------|----------|
| Continuous data streams | ✅ Camera images, sensor data | ❌ |
| One-time queries | ❌ | ✅ "What's the current map?" |
| Configuration changes | ❌ | ✅ "Switch to manual mode" |
| Telemetry | ✅ Robot status, battery level | ❌ |

---

## Actions

Actions are for **long-running tasks** that need feedback and the ability to be canceled. They combine topics and services.

```
┌────────────┐                    ┌────────────┐
│   Action   │  ── Goal ──►      │   Action   │
│   Client   │  ◄── Result ──    │   Server   │
│            │  ◄── Feedback ──  │            │
│            │  ── Cancel ──►    │            │
└────────────┘                    └────────────┘
```

**Example use cases:**
- Navigate to a waypoint (continuous position feedback)
- Pick up an object (progress: approaching → grasping → lifting)
- Execute a walking sequence (step-by-step feedback)

---

## ROS 2 CLI Tools

Essential command-line tools for debugging and introspection:

```bash
# List all running nodes
ros2 node list

# See what topics exist
ros2 topic list

# Echo messages on a topic
ros2 topic echo /robot_status

# Get info about a topic
ros2 topic info /camera/image_raw

# Call a service
ros2 service call /add_two_ints example_interfaces/srv/AddTwoInts "{a: 5, b: 3}"

# List parameters
ros2 param list

# View the computation graph
ros2 run rqt_graph rqt_graph
```

---

## Summary

- **Nodes** are the building blocks — each does one job
- **Topics** enable publish/subscribe for streaming data
- **Services** enable request/response for queries and commands
- **Actions** handle long-running tasks with feedback
- **ROS 2 CLI** tools let you inspect and debug the system

---

## Exercises

1. **Install ROS 2 Humble** on Ubuntu 22.04 following the [official guide](https://docs.ros.org/en/humble/Installation.html)
2. **Create a publisher** that publishes simulated IMU data (random acceleration values)
3. **Create a subscriber** that receives the IMU data and prints a warning when acceleration exceeds a threshold
4. **Explore:** Run `ros2 topic list` and `ros2 node list` while your nodes are running

---

*Next: [Nodes, Topics, and Services Deep Dive →](./nodes-topics-services)*

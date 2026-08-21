---
sidebar_position: 4
title: Capstone Project
---

# Capstone Project: The Autonomous Humanoid

*Week 13: Bringing It All Together*

---

## Project Overview

The capstone integrates every concept from the course into a single end-to-end system: **a simulated humanoid robot** that receives a voice command, plans a path, navigates obstacles, identifies an object using computer vision, and manipulates it.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Autonomous Humanoid System                   │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Whisper  │─►│ GPT-4o   │─►│ Nav2     │─►│ Walking  │        │
│  │ (Voice)  │  │ (Planner)│  │ (Path)   │  │ (Control)│        │
│  └──────────┘  └────┬─────┘  └──────────┘  └──────────┘        │
│                     │                                             │
│  ┌──────────┐  ┌────▼─────┐  ┌──────────┐  ┌──────────┐        │
│  │ Camera   │─►│ YOLOv8   │─►│ Grasp    │─►│ Arm      │        │
│  │ (RGB-D)  │  │ (Detect) │  │ (Plan)   │  │ (Control)│        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                   │
│  ┌──────────┐  ┌──────────┐                                     │
│  │ IMU      │─►│ Balance  │  Simulation: Isaac Sim / Gazebo     │
│  │ (State)  │  │ (Stable) │  Framework: ROS 2 Humble            │
│  └──────────┘  └──────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Requirements

### Minimum Requirements (Pass)

1. **Simulated humanoid** in Gazebo or Isaac Sim with ROS 2
2. **Voice command input** via Whisper (or text input fallback)
3. **LLM-based task planning** converting commands to action sequences
4. **Autonomous navigation** using Nav2 or basic path planning
5. **Object detection** using YOLOv8 or similar model

### Stretch Goals (Distinction)

6. **Object manipulation** — pick up and deliver objects
7. **Dynamic obstacle avoidance** — react to moving obstacles
8. **Multi-step task execution** — handle complex commands
9. **Voice feedback** — robot speaks status updates via TTS
10. **Recovery behaviors** — handle failures gracefully

---

## Implementation Guide

### Step 1: Environment Setup

```bash
# Create ROS 2 workspace
mkdir -p ~/capstone_ws/src
cd ~/capstone_ws/src

# Create the main package
ros2 pkg create --build-type ament_python capstone_humanoid \
  --dependencies rclpy std_msgs sensor_msgs geometry_msgs nav_msgs

# Build
cd ~/capstone_ws
colcon build
source install/setup.bash
```

### Step 2: Launch Everything

```python
# launch/capstone_launch.py
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        # Simulation
        Node(package='capstone_humanoid', executable='sim_manager',
             name='simulation'),
        
        # Perception
        Node(package='capstone_humanoid', executable='camera_node',
             name='camera'),
        Node(package='capstone_humanoid', executable='detector_node',
             name='object_detector'),
        
        # Planning
        Node(package='capstone_humanoid', executable='voice_input',
             name='voice_listener'),
        Node(package='capstone_humanoid', executable='cognitive_planner',
             name='planner'),
        
        # Control
        Node(package='capstone_humanoid', executable='navigator',
             name='navigator'),
        Node(package='capstone_humanoid', executable='walking_controller',
             name='walker'),
        Node(package='capstone_humanoid', executable='arm_controller',
             name='arm'),
    ])
```

### Step 3: The Main Task Manager

```python
class TaskManager(Node):
    """Orchestrates the full autonomous pipeline."""
    
    def __init__(self):
        super().__init__('task_manager')
        self.state = 'IDLE'
        self.voice = VoiceCommandListener()
        self.planner = CognitivePlanner()
        self.executor = ActionExecutor()
    
    async def run_mission(self):
        """Main mission loop."""
        while True:
            # 1. Listen for command
            self.state = 'LISTENING'
            command = self.voice.listen()
            self.get_logger().info(f'Command: {command}')
            
            # 2. Plan actions
            self.state = 'PLANNING'
            plan = self.planner.plan(command)
            self.get_logger().info(f'Plan: {plan}')
            
            # 3. Execute
            self.state = 'EXECUTING'
            for action in plan:
                success = await self.executor.execute(action)
                if not success:
                    self.state = 'RECOVERING'
                    await self.recover(action)
            
            # 4. Report completion
            self.state = 'IDLE'
            self.executor.speak("Task completed!")
```

---

## Evaluation Rubric

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Technical Implementation** | 30% | Code quality, architecture, ROS 2 usage |
| **Integration** | 25% | All modules working together end-to-end |
| **Functionality** | 20% | Robot successfully completes tasks |
| **Documentation** | 15% | Code comments, README, demo video |
| **Innovation** | 10% | Creative additions, novel approaches |

---

## Deliverables

1. **Source code** — ROS 2 package(s) in a Git repository
2. **Demo video** — 90-second recording showing the system in action
3. **Documentation** — README with setup instructions, architecture diagram
4. **Presentation** — 5-minute live demo (if invited)

---

## Summary

The capstone project synthesizes all four modules:
- **Module 1 (ROS 2)** — Nodes, topics, services for system communication
- **Module 2 (Simulation)** — Gazebo/Isaac Sim environment
- **Module 3 (Isaac)** — Perception, detection, navigation
- **Module 4 (VLA)** — Voice input, LLM planning, action execution

This is your opportunity to demonstrate mastery of Physical AI. Good luck! 🚀

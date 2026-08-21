---
sidebar_position: 4
title: Unity for Visualization
---

# Unity for Robot Visualization

*Weeks 6–7: High-Fidelity Rendering and Human-Robot Interaction*

---

## Why Unity?

While Gazebo excels at **physics simulation**, Unity excels at **visual fidelity**. Unity provides:

- **Photorealistic rendering** using HDRP (High Definition Render Pipeline)
- **VR/AR integration** for immersive robot teleoperation
- **Rich environments** — import architectural models, realistic textures
- **ROS 2 integration** via the `Unity-Robotics-Hub` package
- **Cross-platform** deployment (desktop, mobile, web, VR headsets)

### Gazebo vs Unity

| Aspect | Gazebo | Unity |
|--------|--------|-------|
| Physics accuracy | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Visual quality | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| ROS 2 integration | Native | Plugin required |
| Learning curve | Moderate | Steeper |
| VR support | Limited | Excellent |
| Cost | Free & open source | Free for personal |

---

## Unity-ROS 2 Integration

### Architecture

```
┌──────────────────┐     TCP/ROS2    ┌──────────────────┐
│                  │◄───────────────►│                  │
│  Unity Scene     │                 │  ROS 2 System    │
│  (Visualization) │                 │  (Control)       │
│                  │                 │                  │
│  - 3D Rendering  │                 │  - Nodes         │
│  - User Input    │                 │  - Planning      │
│  - VR Interface  │                 │  - Navigation    │
└──────────────────┘                 └──────────────────┘
```

### Setting Up Unity for Robotics

1. Install Unity Hub and create a new 3D (HDRP) project
2. Add the ROS-TCP-Connector package via Unity Package Manager
3. Import your URDF using the URDF Importer package
4. Configure the ROS-TCP-Endpoint for communication

```csharp
// Unity C# script for receiving ROS 2 joint states
using Unity.Robotics.ROSTCPConnector;
using JointStateMsg = RosMessageTypes.Sensor.JointStateMsg;

public class JointStateSubscriber : MonoBehaviour
{
    void Start()
    {
        ROSConnection.GetOrCreateInstance()
            .Subscribe<JointStateMsg>("/joint_states", JointStateCallback);
    }

    void JointStateCallback(JointStateMsg msg)
    {
        // Update Unity joint positions to match ROS
        for (int i = 0; i < msg.position.Length; i++)
        {
            float angle = (float)msg.position[i] * Mathf.Rad2Deg;
            // Apply to corresponding Unity joint transforms
        }
    }
}
```

---

## Creating Realistic Environments

### HDRP Rendering Features

- **Real-time global illumination** — accurate light bouncing
- **Volumetric fog and lighting** — atmospheric effects
- **Screen-space reflections** — reflective surfaces
- **Post-processing** — bloom, depth of field, motion blur

### Environment Design for Robot Testing

Common test environments:

| Environment | Use Case |
|-------------|----------|
| **Office space** | Navigation, object manipulation |
| **Warehouse** | Pick-and-place, logistics |
| **Kitchen** | Domestic assistance tasks |
| **Hospital ward** | Healthcare robotics |
| **Outdoor terrain** | Rough terrain walking |

---

## Human-Robot Interaction in Unity

Unity excels at simulating **human-robot interaction (HRI)** scenarios:

### Animated Human Characters
- Import motion-captured human animations
- Simulate crowds and social navigation scenarios
- Test robot responses to human gestures and proximity

### VR Teleoperation
- Control the robot using VR controllers
- See through the robot's cameras in VR
- Natural hand tracking for robot manipulation

---

## Summary

- Unity provides photorealistic visualization complementing Gazebo's physics
- ROS-TCP-Connector bridges Unity and ROS 2 for real-time data exchange
- HDRP enables high-fidelity rendering for realistic testing environments
- Unity's VR capabilities enable intuitive robot teleoperation
- Combine Gazebo (physics) + Unity (visualization) for comprehensive simulation

---

*Next: [Module 3 — NVIDIA Isaac Platform →](/docs/module-3-nvidia-isaac/isaac-sdk-sim)*

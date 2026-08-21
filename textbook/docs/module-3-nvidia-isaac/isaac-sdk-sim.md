---
sidebar_position: 1
title: Isaac SDK & Isaac Sim
---

# NVIDIA Isaac SDK and Isaac Sim

*Weeks 8–10: Photorealistic Simulation and Synthetic Data Generation*

---

## The NVIDIA Isaac Platform

NVIDIA Isaac is a comprehensive platform for building and deploying AI-powered robots. It consists of three major components:

| Component | Purpose | Runs On |
|-----------|---------|---------|
| **Isaac Sim** | Photorealistic simulation built on Omniverse | RTX GPU workstation |
| **Isaac ROS** | Hardware-accelerated ROS 2 packages | Jetson + x86 |
| **Isaac Lab** | RL training framework for robots | GPU cluster |

### Why Isaac Over Gazebo?

| Feature | Gazebo | Isaac Sim |
|---------|--------|-----------|
| Rendering | OpenGL/Ogre | RTX ray tracing |
| Physics | ODE/Bullet/DART | PhysX 5 |
| Synthetic data | Limited | Built-in pipeline |
| GPU acceleration | Minimal | Full CUDA stack |
| Domain randomization | Manual | Automated via Replicator |
| Parallel environments | Limited | Thousands simultaneously |

---

## Isaac Sim — Omniverse-Powered Simulation

Isaac Sim is built on NVIDIA **Omniverse**, using **USD (Universal Scene Description)** as its scene format — the same format used in Hollywood visual effects.

### Key Capabilities

1. **Photorealistic Rendering** — RTX ray tracing for realistic lighting, shadows, reflections
2. **PhysX 5 Physics** — GPU-accelerated rigid body, soft body, and fluid simulation
3. **Synthetic Data Generation** — Automatically generate labeled training data
4. **Domain Randomization** — Randomize textures, lighting, poses for robust training
5. **ROS 2 Bridge** — Native publish/subscribe to ROS 2 topics

### System Requirements

```
GPU:      NVIDIA RTX 4070 Ti (12GB VRAM) minimum
          RTX 4090 (24GB VRAM) recommended
CPU:      Intel i7 13th Gen+ / AMD Ryzen 9
RAM:      64 GB DDR5 (32 GB absolute minimum)
OS:       Ubuntu 22.04 LTS
Storage:  50 GB+ SSD for assets
```

### Installing Isaac Sim

```bash
# Install via Omniverse Launcher
# 1. Download Omniverse Launcher from developer.nvidia.com
# 2. Install Isaac Sim from the Exchange tab
# 3. Launch Isaac Sim

# Or via pip (headless mode for training)
pip install isaacsim
```

---

## Working with USD Scenes

USD (Universal Scene Description) is a hierarchical scene format:

```python
# Creating a simple scene programmatically
from isaacsim import SimulationApp
simulation_app = SimulationApp({"headless": False})

from omni.isaac.core import World
from omni.isaac.core.objects import DynamicCuboid

world = World(stage_units_in_meters=1.0)

# Add a ground plane
world.scene.add_default_ground_plane()

# Add a cube that responds to physics
cube = world.scene.add(
    DynamicCuboid(
        prim_path="/World/cube",
        name="test_cube",
        position=[0, 0, 1.0],
        size=0.1,
        color=[0.2, 0.6, 1.0],
    )
)

# Run the simulation
world.reset()
for i in range(1000):
    world.step(render=True)
    if i % 100 == 0:
        position, orientation = cube.get_world_pose()
        print(f"Step {i}: Cube position = {position}")

simulation_app.close()
```

---

## Synthetic Data Generation with Replicator

**NVIDIA Replicator** generates labeled training data automatically:

```python
import omni.replicator.core as rep

# Set up a camera
camera = rep.create.camera(
    position=(2, 2, 2),
    look_at=(0, 0, 0)
)

# Define randomization
with rep.trigger.on_frame(num_frames=1000):
    # Randomize object positions
    rep.randomizer.scatter_2d(
        surface=rep.get.prims("/World/Table"),
        num_objects=5
    )
    # Randomize lighting
    rep.randomizer.light(
        intensity=rep.distribution.uniform(500, 2000),
        color=rep.distribution.uniform((0.8, 0.8, 0.8), (1, 1, 1))
    )

# Set up data output
writer = rep.WriterRegistry.get("BasicWriter")
writer.initialize(
    output_dir="/data/synthetic_training",
    rgb=True,
    bounding_box_2d_tight=True,
    semantic_segmentation=True,
    depth=True,
)
writer.attach([camera])
```

This generates thousands of labeled images with:
- RGB images
- 2D bounding boxes
- Semantic segmentation masks
- Depth maps

---

## Isaac Sim + ROS 2 Integration

```python
# Enable ROS 2 bridge in Isaac Sim
import omni.isaac.ros2_bridge as ros2_bridge

# Publish camera images to ROS 2
ros2_bridge.create_camera_publisher(
    camera_prim_path="/World/Robot/head_camera",
    topic_name="/camera/image_raw",
    frame_id="head_camera_link",
    publish_rate=30
)

# Publish joint states
ros2_bridge.create_joint_state_publisher(
    robot_prim_path="/World/Robot",
    topic_name="/joint_states",
    publish_rate=60
)

# Subscribe to joint commands
ros2_bridge.create_joint_command_subscriber(
    robot_prim_path="/World/Robot",
    topic_name="/joint_commands"
)
```

---

## Summary

- **Isaac Sim** provides photorealistic, GPU-accelerated simulation on Omniverse
- **USD scene format** enables complex, hierarchical environments
- **Replicator** automates synthetic data generation with domain randomization
- **ROS 2 bridge** enables seamless integration with existing ROS 2 stacks
- RTX GPU (4070 Ti+) is required for Isaac Sim

---

*Next: [AI-Powered Perception →](./perception-manipulation)*

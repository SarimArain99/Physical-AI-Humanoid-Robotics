---
sidebar_position: 1
title: Workstation Requirements
---

# The "Digital Twin" Workstation

This course is technically demanding. It sits at the intersection of **Physics Simulation**, **Visual Perception**, and **Generative AI** — each requiring significant computational resources.

---

## Minimum Specifications

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **GPU** | NVIDIA RTX 4070 Ti (12GB VRAM) | RTX 4090 (24GB VRAM) |
| **CPU** | Intel Core i7 (13th Gen+) / AMD Ryzen 9 | Intel i9 / AMD Threadripper |
| **RAM** | 32 GB DDR5 | 64 GB DDR5 |
| **Storage** | 512 GB NVMe SSD | 1 TB NVMe SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

:::warning GPU is the Bottleneck
NVIDIA Isaac Sim is an Omniverse application that requires **RTX** (Ray Tracing) capabilities. Standard laptops (MacBooks or non-RTX Windows machines) **will not work** for Isaac Sim. ROS 2 and Gazebo can run on most modern hardware.
:::

### Why These Specs?

- **GPU (VRAM):** Loading USD robot assets + environment + running VLA models simultaneously requires 12GB+ VRAM
- **CPU:** Physics calculations (rigid body dynamics) in Gazebo/Isaac are CPU-intensive
- **RAM:** Complex scene rendering will crash with less than 32 GB; 64 GB provides comfortable margins
- **OS:** ROS 2 Humble/Iron is native to Linux; dual-booting or dedicated Linux machines are recommended

---

## Cloud Alternatives

If you don't have access to RTX hardware, cloud instances are available:

| Provider | Instance | GPU | VRAM | Cost/Hour |
|----------|----------|-----|------|-----------|
| **AWS** | g5.2xlarge | A10G | 24GB | ~$1.50 |
| **AWS** | g6e.xlarge | L40S | 48GB | ~$2.50 |
| **Azure** | NC24ads_A100 | A100 | 80GB | ~$3.67 |
| **GCP** | a2-highgpu-1g | A100 | 40GB | ~$3.67 |

### Cost Estimate

```
Instance: AWS g5.2xlarge (~$1.50/hour)
Usage:    10 hours/week × 13 weeks = 130 hours
Storage:  EBS volume ~$25/quarter
Total:    ~$220 per quarter
```

---

## Software Installation

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install NVIDIA drivers (535+)
sudo apt install nvidia-driver-535

# 3. Install ROS 2 Humble
sudo apt install ros-humble-desktop

# 4. Install Gazebo
sudo apt install ros-humble-ros-gz

# 5. Install Python dependencies
pip install torch torchvision openai whisper numpy scipy

# 6. Install Isaac Sim (via Omniverse Launcher)
# Download from: developer.nvidia.com/omniverse
```

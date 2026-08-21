---
sidebar_position: 3
title: Robot Lab Options
---

# Robot Lab Setup

For the "Physical" part of Physical AI, you need actual robot hardware. Here are three tiers based on budget.

---

## Option A: The "Proxy" Approach (Budget-Friendly)

Use a quadruped or robotic arm as a proxy. The software principles transfer 90% effectively to humanoids.

| | Details |
|---|---|
| **Robot** | Unitree Go2 Edu |
| **Price** | ~$1,800 – $3,000 |
| **Pros** | Highly durable, excellent ROS 2 support, affordable |
| **Cons** | Not a biped (humanoid) |

---

## Option B: Miniature Humanoid

Small, table-top humanoids for kinematics experiments.

| Robot | Price | Notes |
|-------|-------|-------|
| Unitree G1 | ~$16,000 | Full-size, advanced SDK |
| Robotis OP3 | ~$12,000 | Older but stable, ROS support |
| Hiwonder TonyPi Pro | ~$600 | Budget option, Raspberry Pi-based |

:::warning Budget Humanoids
Cheap kits (like Hiwonder) run on Raspberry Pi, which **cannot** run NVIDIA Isaac ROS efficiently. Use these only for kinematics (walking) exercises, and use the Jetson kit for AI workloads.
:::

---

## Option C: Premium Lab (Sim-to-Real)

For actually deploying the Capstone to a real humanoid:

| | Details |
|---|---|
| **Robot** | Unitree G1 Humanoid |
| **Price** | ~$16,000+ |
| **Why** | One of the few commercially available humanoids with dynamic walking and an open SDK for ROS 2 controllers |

---

## Lab Architecture Summary

| Component | Hardware | Function |
|-----------|----------|----------|
| **Sim Rig** | PC with RTX 4080 + Ubuntu 22.04 | Runs Isaac Sim, Gazebo, trains models |
| **Edge Brain** | Jetson Orin Nano | Runs inference stack, student deployments |
| **Sensors** | RealSense Camera + LiDAR | Feeds real-world data to the AI |
| **Actuator** | Unitree Go2 or G1 (Shared) | Receives motor commands from Jetson |

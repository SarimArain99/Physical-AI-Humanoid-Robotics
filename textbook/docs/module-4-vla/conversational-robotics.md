---
sidebar_position: 3
title: Conversational Robotics
---

# Conversational Robotics

*Week 13: Integrating GPT Models for Multi-Modal Human-Robot Interaction*

---

## Voice-to-Action Pipeline

The complete voice-to-action pipeline for a conversational humanoid:

```
┌────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌────────┐
│  User  │───►│  Whisper  │───►│  GPT-4  │───►│  ROS 2   │───►│ Robot  │
│ Speech │    │  (STT)    │    │ (Plan)  │    │ (Execute)│    │ Motion │
└────────┘    └──────────┘    └─────────┘    └──────────┘    └────────┘
                                   │
                              ┌────▼────┐
                              │  TTS    │───► Speaker
                              │ (Voice) │
                              └─────────┘
```

---

## Speech Recognition with Whisper

**OpenAI Whisper** provides robust speech-to-text for voice commands:

```python
import whisper
import sounddevice as sd
import numpy as np

class VoiceCommandListener:
    def __init__(self, model_size='base'):
        self.model = whisper.load_model(model_size)
        self.sample_rate = 16000
    
    def listen(self, duration=5):
        """Record audio and transcribe."""
        print("Listening...")
        audio = sd.rec(
            int(duration * self.sample_rate),
            samplerate=self.sample_rate,
            channels=1, dtype='float32'
        )
        sd.wait()
        
        # Transcribe
        result = self.model.transcribe(
            audio.flatten(),
            language='en',
            fp16=False
        )
        
        command = result['text'].strip()
        print(f"Heard: '{command}'")
        return command
```

---

## Cognitive Planning with LLMs

The key innovation: using LLMs to translate natural language into robot action sequences.

```python
from openai import OpenAI

class CognitivePlanner:
    """Use GPT to convert natural language to robot actions."""
    
    SYSTEM_PROMPT = """You are a robot action planner. Given a natural 
    language command, output a JSON array of robot actions.

    Available actions:
    - move_to(x, y, z): Navigate to position
    - look_at(x, y, z): Turn head toward position
    - pick_up(object_name): Grasp an object
    - place_on(surface_name): Place held object
    - say(message): Speak to the user
    - wave(): Wave greeting gesture
    - point_at(x, y, z): Point toward position
    
    Known objects and their positions:
    - cup: (1.5, 0.3, 0.8)
    - bottle: (1.5, -0.2, 0.8)
    - table: (1.5, 0.0, 0.75)
    - door: (3.0, 2.0, 1.0)

    Output ONLY valid JSON. Example:
    [{"action": "say", "args": {"message": "I'll get that for you"}},
     {"action": "move_to", "args": {"x": 1.5, "y": 0.3, "z": 0}},
     {"action": "pick_up", "args": {"object_name": "cup"}}]
    """
    
    def __init__(self):
        self.client = OpenAI()
    
    def plan(self, command):
        """Convert natural language command to action sequence."""
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": command}
            ],
            response_format={"type": "json_object"},
            temperature=0.1  # Low temp for deterministic plans
        )
        
        import json
        actions = json.loads(response.choices[0].message.content)
        return actions
```

### Example Interaction

```
User: "Hey robot, can you bring me the cup from the table?"

GPT Plan:
[
  {"action": "say",     "args": {"message": "Sure, I'll get the cup for you."}},
  {"action": "move_to", "args": {"x": 1.5, "y": 0.3, "z": 0}},
  {"action": "look_at", "args": {"x": 1.5, "y": 0.3, "z": 0.8}},
  {"action": "pick_up", "args": {"object_name": "cup"}},
  {"action": "move_to", "args": {"x": 0, "y": 0, "z": 0}},
  {"action": "say",     "args": {"message": "Here's your cup!"}}
]
```

---

## Action Execution via ROS 2

```python
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import PoseStamped
from std_msgs.msg import String

class ActionExecutor(Node):
    """Execute planned actions via ROS 2."""
    
    def __init__(self):
        super().__init__('action_executor')
        self.nav_pub = self.create_publisher(
            PoseStamped, '/goal_pose', 10)
        self.speech_pub = self.create_publisher(
            String, '/speech/output', 10)
        self.gripper_pub = self.create_publisher(
            String, '/gripper/command', 10)
    
    def execute_plan(self, actions):
        """Execute a sequence of actions from the cognitive planner."""
        for action in actions:
            name = action['action']
            args = action['args']
            
            self.get_logger().info(f'Executing: {name}({args})')
            
            if name == 'move_to':
                self._navigate(args['x'], args['y'], args.get('z', 0))
            elif name == 'pick_up':
                self._pick_up(args['object_name'])
            elif name == 'say':
                self._speak(args['message'])
            elif name == 'look_at':
                self._look_at(args['x'], args['y'], args['z'])
    
    def _navigate(self, x, y, z):
        msg = PoseStamped()
        msg.pose.position.x = float(x)
        msg.pose.position.y = float(y)
        msg.pose.position.z = float(z)
        self.nav_pub.publish(msg)
    
    def _speak(self, message):
        msg = String()
        msg.data = message
        self.speech_pub.publish(msg)
```

---

## Vision-Language-Action (VLA) Models

The cutting edge: **VLA models** that directly map vision + language to robot actions, bypassing explicit planning.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│              Vision-Language-Action Model             │
│                                                       │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │  Vision   │   │  Language    │   │  Action      │ │
│  │  Encoder  │──►│  Encoder     │──►│  Decoder     │ │
│  │(ViT/DINO)│   │ (LLM Backbone│   │ (MLP/Diff.)  │ │
│  └──────────┘   └──────────────┘   └──────────────┘ │
│       ▲               ▲                    │         │
│   Camera Image   Text Command        Robot Action    │
│                                    (joint velocities)│
└─────────────────────────────────────────────────────┘
```

### Notable VLA Models

| Model | Developer | Key Feature |
|-------|-----------|-------------|
| **RT-2** | Google DeepMind | Web-scale pretraining transfers to robots |
| **Octo** | UC Berkeley | Open-source, generalizable |
| **OpenVLA** | Stanford | Open-weights VLA for manipulation |
| **π₀** | Physical Intelligence | Multi-task dexterous manipulation |

---

## Summary

- Whisper enables robust voice command recognition
- GPT-4 translates natural language into structured action plans
- ROS 2 bridges cognitive plans to physical robot execution
- VLA models represent the frontier — direct vision+language→action mapping
- Multi-modal interaction (speech, gesture, vision) creates natural HRI

---

*Next: [Capstone Project →](./capstone-project)*

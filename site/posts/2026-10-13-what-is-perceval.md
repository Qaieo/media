---
title: "What is Perceval?"
date: 2026-10-13
source: "Quandela docs and repo"
source_url: "https://github.com/Quandela/Perceval"
tags: ["explainer"]
tweet: "Perceval is the open-source framework for programming photonic quantum computers. What it is and why it's the one to watch:"
---

**Perceval** is Quandela's open-source Python framework for photonic quantum computing. If Qiskit is the SDK for superconducting qubits, Perceval is the equivalent for photons.

Photonic quantum computers use particles of light as qubits. They run at room temperature, network naturally over fiber, and are the bet of companies like Quandela, PsiQuantum, Xanadu, and ORCA. The programming model is different from gate-based machines: you design linear optical circuits (beam splitters, phase shifters, detectors) and the framework simulates them or targets real hardware.

What Perceval gives you:

- **Circuit design** for linear optical quantum computing, with a simulator backend for development.
- **Hardware access** to Quandela's photonic QPUs through the cloud.
- **Error mitigation** (as of v1.3.0) for dealing with the probabilistic reality of photonic hardware: loss, detector imperfections, partial distinguishability.
- **A growing algorithm library** for the problems photonics is naturally good at: boson sampling, graph problems, quantum machine learning.

It's Apache-licensed, actively developed (monthly-ish releases), and currently the most alive open-source project in photonic quantum software. Which brings us to the bigger story.

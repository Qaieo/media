---
title: "Photonic quantum hardware landscape, October 2026"
date: 2026-10-13
source: "Qaieo editorial"
source_url: "https://www.futuremarketsinc.com/the-global-photonic-quantum-computing-market-2026-2036/"
tags: ["analysis", "editorial", "hardware"]
tweet: "Photonic quantum computing attracted $2.1B in 2025, more than superconducting. A field guide to who's building what:"
---

Photonic quantum computing had its breakout year. Private capital into photonic hardware hit **$2.1 billion in 2025**, about 21% of all quantum tech investment, overtaking superconducting as the largest hardware subcategory (per Future Markets' 2026 report). Here's the field as it stands.

**Three architectures, three bets.** Continuous-variable systems, led by **Xanadu**, encode information in squeezed light and target quantum machine learning through PennyLane. Discrete-variable systems (**PsiQuantum**, **Quandela**, **ORCA**, QuiX) work with individual photons in linear optical circuits, aiming at fault-tolerant universal machines. Hybrid spin-photon (**Photonic Inc**, backed by Microsoft) links silicon spin qubits with telecom photons for distributed architectures.

**PsiQuantum** is the capital leader: a [$1B Series E in September 2025](https://www.businesswire.com/news/home/20250910135739/en/PsiQuantum-Raises-$1-Billion-to-Build-Million-Qubit-Scale-Fault-Tolerant-Quantum-Computers) (BlackRock, Temasek, Baillie Gifford; $7B valuation), a $100M CHIPS Act agreement finalized in September 2026, and the Omega silicon-photonic chipset fabbed at GlobalFoundries on a standard 300mm process. Brisbane and Chicago utility-scale sites are under construction, with leadership shifting to ex-AMD/Xilinx chief Victor Peng as interim CEO for the scaling phase. The bet: photons don't generate heat or feel electromagnetic interference, so chips link over standard fiber and the million-qubit roadmap is a manufacturing problem, not a physics problem.

**Xanadu** became the first pure-play photonic quantum company on a major public market, listing on NASDAQ and the TSX as XNDU in March 2026 via SPAC (~$302M gross proceeds, $275M PIPE). The hardware story in 2026 is packaging: an [average 0.085 dB/facet edge-coupling loss](https://www.newswire.ca/news-releases/xanadu-sets-new-industry-benchmark-in-photonic-chip-packaging-834077847.html), meaning 98%+ of the optical signal survives each fiber-to-chip interface. In photonics, loss is the enemy that compounds at every interface, so this is a genuine milestone, not marketing, though edge coupling is one of roughly 16-17 loss contributors, and analysts estimate another 5-10x system-wide reduction is still needed for fault tolerance. The software story is the opposite: Strawberry Fields and MrMustard are archived, and PennyLane carries the stack alone.

**Quandela** is the deployment leader in Europe: the 12-qubit Belenos system serves 1,200+ researchers across 30 countries via cloud, and its EuroHPC sibling Lucy was delivered to CEA's TGCC and inaugurated in April 2026. Perceval, its open framework, is the subject this publication tracks most closely.

**ORCA Computing** is the operational-simplicity play: [its PT Series system was installed at the UK's National Quantum Computing Centre and powered up and operational within 36 hours](https://www.hpcwire.com/off-the-wire/orca-computing-delivers-1st-photonic-quantum-computing-system-to-uks-nqcc/) (June 2025). Rack-mounted, room-temperature (cryogenics confined to the detectors), accessible via NVIDIA's CUDA-Q. When a quantum computer installs faster than enterprise SaaS, the deployment model has changed.

**Don't forget Hefei.** USTC's Jiuzhang 4.0 manipulated and detected 3,050 photons in Gaussian boson sampling (reported in *Nature*, May 2026), still the academic high-water mark. China's photonic program runs quieter than the venture-backed Western companies but keeps setting the experimental bar.

**What to watch.** Whether PsiQuantum's manufacturing bet converts capital into deployed systems. Whether Xanadu's public-market discipline accelerates or starves its hardware roadmap. Whether Quandela's European deployments compound into a developer ecosystem around Perceval. And whether anyone else open-sources a serious photonic framework, or the field consolidates around one.

*Editorial synthesis from public reporting. Company claims are as stated by the companies; treat funding and timeline figures accordingly. Corrections welcome via the [GitHub repo](https://github.com/omeal007/qaieo).*

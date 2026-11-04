# E.V.'s recorded voice

`af_heart.bin` holds every fixed sentence E.V. can say, spoken by the open
[Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) model (Apache-2.0) with its
"Heart" voice, one small MP3 per sentence, back to back. `af_heart.json` maps each
sentence to its byte range.

To rebuild after changing her lines: run `EV.allLines()` in the app to list the
sentences, render each with kokoro-js (`voice: 'af_heart'`, `E.V.` read as `E V`),
encode to mono MP3, and pack them in the same order. Sentences that are not in the
library (print job names, or another voice) are generated on the device instead
(`ev-voice.js`).

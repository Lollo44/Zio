#!/bin/bash
cd webapp
# Run HTTP Server allowing all network access
python3 -m http.server 8000 --bind 0.0.0.0

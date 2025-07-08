#!/bin/bash
export NODE_ENV=development
export PATH="/nix/store/lyx73qs96hfazl77arnwllwckq9dy012-nodejs-20.18.1-wrapped/bin:$PATH"
cd /home/runner/workspace
tsx server/index.ts
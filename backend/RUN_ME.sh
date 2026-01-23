#!/bin/bash
# Simple wrapper script to run add_client_direct.py
# Usage: ./RUN_ME.sh "Client Name" "0xWalletAddress"

cd "$(dirname "$0")"

if [ $# -lt 2 ]; then
    echo "Usage: ./RUN_ME.sh \"Client Name\" \"0xWalletAddress\" [email]"
    echo ""
    echo "Example:"
    echo '  ./RUN_ME.sh "Sharp Trading" "0x4e77eeDbBa3E5016603FE700f8A1A3293BF6eDA5"'
    exit 1
fi

python3 add_client_direct.py "$@"

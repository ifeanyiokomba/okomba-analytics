#!/usr/bin/env python3
"""Start the Next.js dev server as a TRUE daemon (double-fork).

Why: backgrounded processes from tool calls are reaped when the call
ends (tree-kill). A canonical double-fork reparents the server to
PID 1 DURING the call, so it survives across calls — same trick
pg_ctl and the agent-browser daemon already use in this sandbox.

Usage:  python3 scripts/start-dev-daemon.py   (idempotent-ish:
        kills any existing dev server first)
"""
import os
import subprocess
import sys
import time

BUN = "/usr/local/bin/bun"
PROJECT = "/home/z/my-project"


def main() -> int:
    os.chdir(PROJECT)
    # Kill any existing dev server (port 3000 owner)
    subprocess.run(
        ["pkill", "-f", "next-server"], capture_output=True
    )
    subprocess.run(["pkill", "-f", "bun run dev"], capture_output=True)
    time.sleep(1.5)

    pid = os.fork()
    if pid == 0:
        os.setsid()
        pid2 = os.fork()
        if pid2 == 0:
            env = dict(os.environ)
            env.pop("DATABASE_URL", None)  # avoid stale shell shadow (Task 38)
            log = os.open("dev.log", os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
            os.dup2(log, 1)
            os.dup2(log, 2)
            devnull = os.open(os.devnull, os.O_RDONLY)
            os.dup2(devnull, 0)
            os.execve(BUN, ["bun", "run", "dev"], env)
        os._exit(0)
    os.waitpid(pid, 0)

    # Wait for readiness (max 60s)
    for i in range(30):
        try:
            with subprocess.Popen(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                 "http://localhost:3000/api/health/ready"],
                stdout=subprocess.PIPE,
            ) as p:
                out = p.communicate(timeout=5)[0].decode().strip()
            if out == "200":
                print(f"dev server daemon ready (attempt {i + 1})")
                return 0
        except Exception:
            pass
        time.sleep(2)
    print("dev server did not become ready in 60s — check dev.log", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())

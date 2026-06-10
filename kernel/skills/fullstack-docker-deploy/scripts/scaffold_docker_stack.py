#!/usr/bin/env python3
"""
Scaffold a standardized fullstack Docker stack from skill templates.
"""

from __future__ import annotations

import argparse
from pathlib import Path


PLACEHOLDERS = {
    "PROJECT_NAME": "app",
    "FRONTEND_PORT": "3000",
    "BACKEND_PORT": "3001",
    "DB_PORT": "5432",
    "POSTGRES_DB": "appdb",
    "POSTGRES_USER": "appuser",
    "POSTGRES_PASSWORD": "change_me",
    "FRONTEND_APP_DIR": "frontend",
    "BACKEND_APP_DIR": "backend",
    "FRONTEND_DEV_CMD": "npm run dev -- --host 0.0.0.0 --port 3000",
    "BACKEND_DEV_CMD": "npm run dev",
    "FRONTEND_PROD_CMD": "npm run start",
    "BACKEND_PROD_CMD": "npm run start",
    "BACKEND_MIGRATION_CMD": "",
}


def render_template(content: str, values: dict[str, str]) -> str:
    rendered = content
    for key, value in values.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", value)
    return rendered


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold fullstack Docker stack templates.")
    parser.add_argument("--target", default=".", help="Target project directory.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files.")
    parser.add_argument("--project-name", default=PLACEHOLDERS["PROJECT_NAME"])
    parser.add_argument("--frontend-port", default=PLACEHOLDERS["FRONTEND_PORT"])
    parser.add_argument("--backend-port", default=PLACEHOLDERS["BACKEND_PORT"])
    parser.add_argument("--db-port", default=PLACEHOLDERS["DB_PORT"])
    args = parser.parse_args()

    skill_dir = Path(__file__).resolve().parents[1]
    templates_dir = skill_dir / "templates"
    target_dir = Path(args.target).resolve()

    values = dict(PLACEHOLDERS)
    values["PROJECT_NAME"] = args.project_name
    values["FRONTEND_PORT"] = str(args.frontend_port)
    values["BACKEND_PORT"] = str(args.backend_port)
    values["DB_PORT"] = str(args.db_port)

    mapping = {
        "docker-compose.dev.yml.tpl": "docker-compose.dev.yml",
        "docker-compose.prod.yml.tpl": "docker-compose.prod.yml",
        "env.example.tpl": ".env.example",
        "docker_backend_Dockerfile.tpl": "docker/backend/Dockerfile",
        "docker_frontend_Dockerfile.tpl": "docker/frontend/Dockerfile",
        "docker_nginx_default.conf.tpl": "docker/nginx/default.conf",
        "ops_deploy-docker.sh.tpl": "ops/deploy-docker.sh",
    }

    written: list[Path] = []
    skipped: list[Path] = []

    for src_name, dst_rel in mapping.items():
        src = templates_dir / src_name
        dst = target_dir / dst_rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists() and not args.force:
            skipped.append(dst)
            continue

        content = src.read_text(encoding="utf-8")
        dst.write_text(render_template(content, values), encoding="utf-8")
        written.append(dst)

    print(f"Scaffold target: {target_dir}")
    print(f"Written: {len(written)}")
    for p in written:
        print(f"  + {p}")
    print(f"Skipped: {len(skipped)}")
    for p in skipped:
        print(f"  - {p} (use --force to overwrite)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())


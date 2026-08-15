import os
import shutil
import argparse
from pathlib import Path

# Configuração de caminhos (relativos à raiz do projeto)
# O script reside em .sfk/kernel/scripts/, então subimos três níveis até a raiz
PROJECT_ROOT = Path(__file__).resolve().parents[3]
SKILLS_DIR = PROJECT_ROOT / ".sfk" / "kernel" / "skills"
CURSOR_RULES_DIR = PROJECT_ROOT / ".cursor" / "rules"

def import_skill(source_path, force=False):
    # Resolver o caminho (lida com '~' e caminhos relativos)
    source = Path(os.path.expanduser(source_path)).resolve()

    if not source.exists():
        print(f"❌ Erro: O caminho '{source}' não existe.")
        return False

    if not source.is_dir():
        print(f"❌ Erro: '{source}' não é uma pasta.")
        return False

    # Usar o nome da pasta como nome da skill
    skill_name = source.name
    dest_skill_dir = SKILLS_DIR / skill_name

    print(f"\n🚀 Iniciando importação da skill: {skill_name}")
    print(f"📂 Origem: {source}")

    # 1. Garantir que o diretório de skills existe
    SKILLS_DIR.mkdir(parents=True, exist_ok=True)

    # 2. Copiar pasta para .sfk/kernel/skills/
    if dest_skill_dir.exists():
        if not force:
            confirm = input(f"⚠️  A skill '{skill_name}' já existe. Deseja sobrescrever? (s/n): ").lower()
            if confirm != 's':
                print("❌ Operação cancelada.")
                return False
        shutil.rmtree(dest_skill_dir)

    try:
        shutil.copytree(source, dest_skill_dir)
        print(f"✅ Pasta copiada para: .sfk/kernel/skills/{skill_name}")
    except Exception as e:
        print(f"❌ Erro ao copiar pasta: {e}")
        return False

    # 3. Atualizar ponte do Cursor (.cursor/rules/)
    CURSOR_RULES_DIR.mkdir(parents=True, exist_ok=True)
    skill_md = dest_skill_dir / "SKILL.md"
    
    if skill_md.exists():
        cursor_rule_file = CURSOR_RULES_DIR / f"{skill_name}.md"
        try:
            shutil.copy2(skill_md, cursor_rule_file)
            print(f"✅ Regra do Cursor atualizada: .cursor/rules/{skill_name}.md")
        except Exception as e:
            print(f"⚠️  Erro ao atualizar ponte do Cursor: {e}")
    else:
        # Se não houver SKILL.md, tentamos procurar por qualquer arquivo .md principal
        md_files = list(dest_skill_dir.glob("*.md"))
        if md_files:
            # Pega o primeiro ou um com nome similar
            target_md = md_files[0]
            cursor_rule_file = CURSOR_RULES_DIR / f"{skill_name}.md"
            shutil.copy2(target_md, cursor_rule_file)
            print(f"✅ Regra do Cursor criada usando {target_md.name}: .cursor/rules/{skill_name}.md")
        else:
            print(f"⚠️  Aviso: Nenhum arquivo .md encontrado na skill. Cursor não terá uma regra dedicada.")

    print(f"\n🎉 Skill '{skill_name}' importada com sucesso!")
    print(f"📝 Nota: As configurações globais (.clauderules e .windsurfrules) já apontam para a pasta .sfk/kernel/skills/ e reconhecerão a nova skill automaticamente.")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Importa uma nova skill para o framework SFK.")
    parser.add_argument("path", nargs="?", help="Caminho da pasta da skill a ser importada")
    parser.add_argument("--force", action="store_true", help="Sobrescreve sem perguntar (uso não-interativo, ex: GUI)")
    args = parser.parse_args()

    if args.path:
        ok = import_skill(args.path, force=args.force)
    else:
        # Modo interativo
        print("--- SFK Skill Importer ---")
        path_input = input("📂 Arraste a pasta da skill aqui ou digite o caminho: ").strip()
        # Limpar aspas se o usuário arrastou a pasta
        path_input = path_input.replace('"', '').replace("'", "")
        if path_input:
            ok = import_skill(path_input, force=args.force)
        else:
            print("❌ Nenhum caminho fornecido.")
            ok = False

    raise SystemExit(0 if ok else 1)

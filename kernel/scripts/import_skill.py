import os
import shutil
import argparse
from pathlib import Path

# Configuração de caminhos (relativos à raiz do projeto)
# O script reside em kernel/scripts/, então subimos dois níveis
PROJECT_ROOT = Path(__file__).parent.parent.parent
SKILLS_DIR = PROJECT_ROOT / "kernel" / "skills"
CURSOR_RULES_DIR = PROJECT_ROOT / ".cursor" / "rules"

def import_skill(source_path):
    # Resolver o caminho (lida com '~' e caminhos relativos)
    source = Path(os.path.expanduser(source_path)).resolve()
    
    if not source.exists():
        print(f"❌ Erro: O caminho '{source}' não existe.")
        return
    
    if not source.is_dir():
        print(f"❌ Erro: '{source}' não é uma pasta.")
        return

    # Usar o nome da pasta como nome da skill
    skill_name = source.name
    dest_skill_dir = SKILLS_DIR / skill_name

    print(f"\n🚀 Iniciando importação da skill: {skill_name}")
    print(f"📂 Origem: {source}")

    # 1. Garantir que o diretório de skills existe
    SKILLS_DIR.mkdir(parents=True, exist_ok=True)

    # 2. Copiar pasta para kernel/skills/
    if dest_skill_dir.exists():
        confirm = input(f"⚠️  A skill '{skill_name}' já existe. Deseja sobrescrever? (s/n): ").lower()
        if confirm != 's':
            print("❌ Operação cancelada.")
            return
        shutil.rmtree(dest_skill_dir)
    
    try:
        shutil.copytree(source, dest_skill_dir)
        print(f"✅ Pasta copiada para: kernel/skills/{skill_name}")
    except Exception as e:
        print(f"❌ Erro ao copiar pasta: {e}")
        return

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
    print(f"📝 Nota: As configurações globais (.clauderules e .windsurfrules) já apontam para a pasta kernel/skills/ e reconhecerão a nova skill automaticamente.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Importa uma nova skill para o framework SFK.")
    parser.add_argument("path", nargs="?", help="Caminho da pasta da skill a ser importada")
    args = parser.parse_args()

    if args.path:
        import_skill(args.path)
    else:
        # Modo interativo
        print("--- SFK Skill Importer ---")
        path_input = input("📂 Arraste a pasta da skill aqui ou digite o caminho: ").strip()
        # Limpar aspas se o usuário arrastou a pasta
        path_input = path_input.replace('"', '').replace("'", "")
        if path_input:
            import_skill(path_input)
        else:
            print("❌ Nenhum caminho fornecido.")

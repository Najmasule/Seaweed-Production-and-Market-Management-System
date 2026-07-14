import os
import glob

# Orodha ya apps tunazotaka kusafisha
apps = ['production', 'inventory']

for app in apps:
    # Tafuta mafaili yote ya .py kwenye folda la migrations la app husika
    path = os.path.join(app, 'migrations', '*.py')
    files = glob.glob(path)
    
    for file in files:
        # Futa kila faili la .py ISPOCUWA __init__.py
        if not file.endswith('__init__.py'):
            os.remove(file)
            print(f"Imefutwa: {file}")

print("Usafi wa migrations umekamilika kikamilifu! 🎉")
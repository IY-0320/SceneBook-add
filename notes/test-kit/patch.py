import sys,json
# usage: patch.py file  < json [[old,new],...]   (keeps line endings: newline='')
p=sys.argv[1];pairs=json.load(sys.stdin)
s=open(p,encoding='utf-8',newline='').read()
for old,new in pairs:
    if old.startswith('@AFTER_LAST_IMPORT'):
        lines=s.split('\n');idx=max(i for i,l in enumerate(lines) if l.startswith('import '))
        eol='\r' if lines[idx].endswith('\r') else ''
        lines.insert(idx+1,new+eol);s='\n'.join(lines);continue
    c=s.count(old)
    assert c==1,(p,c,old[:80])
    s=s.replace(old,new)
open(p,'w',encoding='utf-8',newline='').write(s)

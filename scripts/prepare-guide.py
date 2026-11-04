from PIL import Image
from pathlib import Path
root=Path('C:/Users/gabri/AppData/Local/Temp')
out=Path('scripts/guide-assets')
files=[('login','d146a060-348d-4f1f-b4aa-f0cac782d15c',(1125,210,1625,710)),('cadastro','a1d6866e-2a1a-4e24-84b7-3e3810bc9723',(1120,60,1625,855)),('visao','4c22eb8a-30f8-4998-beb9-0b8a2d1fdd45',(350,90,1810,755)),('checklist','ecd90361-ba18-48be-8331-dc4217824cb3',(360,95,1810,700)),('salas','342994de-7d85-4215-a7df-bf006f1d46e3',(350,95,1805,820)),('relatorios','81d40278-0232-4ef4-ae40-030565e77307',(350,95,1805,855)),('registro','0bd46807-367e-465a-87db-858064be3167',(1293,0,1913,914)),('apoio','644edd52-1853-417a-b1c9-d6a8ba694020',(350,100,1805,910))]
for name,uid,box in files:
 im=Image.open(root/f'codex-clipboard-{uid}.png'); im.crop(box).save(out/f'{name}.png',optimize=True)
im=Image.open(root/'codex-clipboard-4c22eb8a-30f8-4998-beb9-0b8a2d1fdd45.png'); im.crop((12,16,181,69)).save(out/'logo.png')
try:
 import fitz
 print('PDF inspection available')
except ImportError: pass

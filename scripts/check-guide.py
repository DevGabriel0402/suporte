from pypdf import PdfReader
import pypdfium2 as pdfium
p='public/guias/guia-conecta-ti.pdf'
r=PdfReader(p)
print('Pages:',len(r.pages))
for i,page in enumerate(r.pages):
 t=page.extract_text();print(i+1,len(t),t[-65:].replace('\n',' '))
doc=pdfium.PdfDocument(p)
from PIL import Image
thumbs=[]
for page in doc:
 im=page.render(scale=.65).to_pil().convert('RGB');thumbs.append(im)
canvas=Image.new('RGB',(thumbs[0].width*4,thumbs[0].height*2),'#dbe2ee')
for i,im in enumerate(thumbs):canvas.paste(im,((i%4)*im.width,(i//4)*im.height))
canvas.save('scripts/guide-assets/preview.jpg')

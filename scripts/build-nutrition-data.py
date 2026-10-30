"""Crea il sottoinsieme tracciato delle tabelle. Input: ZIP USDA SR Legacy CSV ufficiale.
Non riscrive ricette o immagini. Eseguire: python scripts/build-nutrition-data.py <zip>
"""
import csv, hashlib, io, json, sys, zipfile
from pathlib import Path
root = Path(__file__).resolve().parents[1]
archive = Path(sys.argv[1]) if len(sys.argv)>1 else root/'test-results/usda-sr.zip'
z = zipfile.ZipFile(archive)
def read(name):
    path = next(n for n in z.namelist() if n.endswith('/'+name))
    return list(csv.DictReader(io.TextIOWrapper(z.open(path), encoding='utf-8-sig')))
foods = {f['fdc_id']:f for f in read('food.csv')}
nutrients = {}
for n in read('food_nutrient.csv'):
    if n['nutrient_id'] in ['1008','1003','1004','1005','1079']:
        nutrients.setdefault(n['fdc_id'],{})[n['nutrient_id']] = float(n['amount'])
portions = {}
for p in read('food_portion.csv'):
    portions.setdefault(p['fdc_id'],[]).append({'amount':float(p['amount']),'modifier':p['modifier'],'grams':float(p['gram_weight'])})
profiles = {}
spec = '''flour|Farina di frumento|168894
chickpea-flour|Farina di ceci|174288
rice|Riso bianco secco|169756
rice-cooked|Riso bianco cotto|168935
pasta|Pasta secca|168927
couscous|Cous cous secco|169699
lentils|Lenticchie secche|172420
chickpeas|Ceci cotti|173757
beans|Fagioli in scatola sgocciolati|174285
chicken|Petto di pollo crudo|171077
chicken-cooked|Petto di pollo cotto|171477
beef95|Manzo macinato 95/5 crudo|171790
beef93|Manzo macinato 93/7 crudo|173110
turkey|Macinato di tacchino magro crudo|172847
turkey-sliced|Fesa di tacchino affettata|172941
salmon|Salmone affumicato|173687
tuna|Tonno al naturale sgocciolato|173709
egg|Uovo intero senza guscio|171287
egg-white|Albume|172183
cheddar-free|Cheddar senza grassi|171295
mozzarella-free|Mozzarella senza grassi|169051
mozzarella|Mozzarella vaccina|170845
cream-cheese|Formaggio spalmabile|173418
cottage|Fiocchi di latte magri|172181
feta|Feta|173420
blue-cheese|Formaggio erborinato|172175
parmesan|Parmigiano|170848
yogurt|Yogurt greco magro|170894
yogurt-vanilla|Yogurt greco vaniglia magro|170902
milk|Latte parzialmente scremato 1%|170872
tortilla|Tortilla di frumento|173242
ham|Prosciutto stagionato: riferimento generico|167876
peanut-butter|Burro di arachidi|172470
almond-butter|Burro di mandorle|168588
hazelnuts|Nocciole|170581
peanuts|Arachidi tostate|173806
cashews|Anacardi|170162
cocoa|Cacao amaro|169593
chocolate|Cioccolato fondente 70-85%|170273
baking-powder|Lievito per dolci|172803
starch|Amido di mais: riferimento per fecola|169698
olive-oil|Olio di oliva|171413
coconut-oil|Olio di cocco|171412
soy|Salsa di soia a ridotto sodio|172474
enchilada|Salsa enchilada|174074
cheese-sauce|Salsa al formaggio|171191
ranch|Salsa ranch a ridotto contenuto di grassi|173593
bbq|Salsa barbecue tradizionale|174523
pesto|Pesto di basilico|171579
taco|Condimento taco|172243
tomato-puree|Passata di pomodoro|170460
broth|Brodo di pollo pronto|174536
rice-cake|Galletta di riso|170250
bread|Pane bianco|174924
lettuce|Lattuga|169249
broccoli|Broccoli surgelati|169968
potato|Patate crude|170026
potato-cooked|Patate cotte|170440
radicchio|Radicchio|168564
tomato|Pomodori|170457
zucchini|Zucchine|169291
onion|Cipolla|170000
scallion|Cipollotto|170005
garlic|Aglio|169230
carrot|Carota|170393
celery|Sedano|169988
avocado|Avocado|171705
banana|Banana senza buccia|173944
apple|Mela con buccia|171688
pear|Pera|169118
orange|Arancia senza buccia|169097
sugar|Zucchero|169655
honey|Miele|169640
oats|Fiocchi di avena|169705
salt|Sale|173468
water|Acqua|173647
pepper-canned|Peperoncino in scatola: riferimento|170080
jam|Marmellata a ridotto contenuto di zuccheri|167706
garlic-powder|Aglio in polvere|171325
onion-powder|Cipolla in polvere|171327
paprika|Paprika|171329
black-pepper|Pepe nero|170931
cayenne|Peperoncino di Cayenna|170932
oregano|Origano secco|171328
thyme|Timo secco|170938
ginger|Zenzero fresco|169231
pumpkin|Zucca|168448
basil|Basilico fresco|172232
parsley|Prezzemolo fresco|170416
chives|Erba cipollina fresca|169994
arugula|Rucola|169387
lime|Lime|168155
green-beans|Fagiolini|169961
nutmeg|Noce moscata|171326
sage|Salvia secca|170935
turmeric|Curcuma|172231
cumin|Cumino|170923
curry|Curry|170924
chili|Chili in polvere|171319
bay|Alloro|170917
mint|Menta fresca|173475
wine|Vino rosso|173190'''
for line in spec.splitlines():
    key,label,fdc = line.split('|'); n=nutrients[fdc]
    profiles[key]={'label':label,'source':'USDA SR Legacy 2018','sourceId':fdc,'description':foods[fdc]['description'],'url':f'https://fdc.nal.usda.gov/food-details/{fdc}/nutrients','unit':'g','nutrients':{'kcal':n.get('1008'),'proteinG':n.get('1003'),'fatG':n.get('1004'),'carbsG':max(0,n['1005']-n['1079']) if '1079' in n else n.get('1005')},'totalCarbsG':n.get('1005'),'fiberG':n.get('1079'),'portions':portions.get(fdc,[])}
def label(key,name,kcal,p,c,f,url):
    profiles[key]={'label':name,'source':'Etichetta produttore, consultata 2026-10-30','sourceId':key,'url':url,'unit':'g','nutrients':dict(kcal=kcal,proteinG=p,carbsG=c,fatG=f),'portions':[]}
label('philadelphia-protein','Philadelphia Protein (riferimento)',87,11,4.9,2.5,'https://www.philadelphia.eu/it/i-prodotti/philadelphia-protein/index.html')
label('light-cheese','Sottilette Light (riferimento)',174,16,8,6.8,'https://www.sottilette.it/product/light/index.html')
label('mozzarella-light','Galbani La Leggera (riferimento)',171,17,1,11,'https://www.galbani.it/prodotti/santa-lucia/mozzarella-leggera')
label('piadina','Piadina tradizionale Levoni (riferimento)',314,7.5,49,9.2,'https://shop.levoni.it/media/catalog/attribute-data/piadina_levoni.pdf')
label('protein-cream','BioTechUSA Protein Cream bianca (riferimento)',475,15,48,30,'https://shop.biotechusa.com/collections/losing-weight/products/protein-cream-400-g-white-chocolate-flavoured')
label('erythritol','Sukrin eritritolo (polioli)',0,0,100,0,'https://sukrin.com/en/products/sukrin')
groups = '''water|acqua acqua-bollente acqua-frizzante acqua-per-la-salsa acqua-tiepida ghiaccio
garlic|aglio aglio-tritato
garlic-powder|aglio-in-polvere aglio-in-spezia
egg-white|albume
bay|alloro
cashews|anacardi
peanuts|arachidi-tritate
avocado|avocado
banana|banana-matura banane
basil|basilico
broccoli|broccoli-congelati
broth|brodo-di-pollo-o-acqua brodo-o-acqua-calda
peanut-butter|burro-di-arachidi burro-di-arachidi-100
almond-butter|burro-di-mandorle
hazelnuts|burro-di-nocciole
cocoa|cacao-amaro cacao-amaro-per-guarnire
carrot|carota carote
chickpeas|ceci ceci-cotti
cheddar-free|cheddar-senza-grassi
chili|chili chili-in-polvere
pepper-canned|chipotle-in-scatola peperoncino-chipotle-in-scatola
chocolate|cioccolato-fondente-85 gocce-di-cioccolato gocce-di-cioccolato-fondente
onion|cipolla cipolla-bianca cipolla-rossa
onion-powder|cipolla-in-polvere cipolla-in-spezia
scallion|cipollotto
taco|condimento-taco
couscous|cous-cous
protein-cream|crema-proteica-bigusto
cumin|cumino
turmeric|curcuma
curry|curry-in-polvere
erythritol|dolcificante eritritolo
chives|erba-cipollina-fresca
sugar|eritritolo-o-zucchero
beans|fagioli-in-barattolo
green-beans|fagiolini-o-verdura-a-scelta
flour|farina
chickpea-flour|farina-di-ceci
starch|fecola-di-patate fecola-di-patate-per-la-salsa
turkey-sliced|fesa-di-tacchino
feta|feta
oats|fiocchi-d-avena
cottage|fiocchi-di-latte-0-grassi
cream-cheese|formaggio-fresco-cremoso formaggio-spalmabile
light-cheese|formaggio-light
rice-cake|gallette-di-riso
blue-cheese|gorgonzola-dolce
olive-oil|grasso-per-ungere-la-padella grasso-per-ungere-le-pirofile olio olio-extravergine-d-oliva spray-per-cottura
lettuce|insalata insalata-mista lattuga
milk|latte-o-bevanda-vegetale
lentils|lenticchie-secche
baking-powder|lievito-per-dolci
lime|lime
turkey|macinato-di-fesa-di-tacchino
beef95|macinato-magro-di-manzo macinato-magro-di-manzo-96-4
beef93|manzo-macinato-93-7
jam|marmellata-light
mint|menta
honey|miele
oregano|mix-di-erbe origano
bread|mollica-di-pane-bagnata-in-acqua
mozzarella|mozzarella
mozzarella-light|mozzarella-light mozzarella-proteica
mozzarella-free|mozzarella-senza-grassi
nutmeg|noce-moscata
coconut-oil|olio-di-cocco olio-di-cocco-o-di-semi
paprika|paprika paprika-affumicata spezie-per-la-farina
parmesan|parmigiano parmigiano-reggiano
tomato-puree|passata-di-pomodoro salsa-di-pomodoro
pasta|pasta
potato|patate
potato-cooked|patate-a-cubetti
black-pepper|pepe pepe-nero
cayenne|peperoncino-di-cayenna
pesto|pesto
chicken|petto-di-pollo petto-di-pollo-disossato-senza-pelle petto-di-pollo-senza-pelle
philadelphia-protein|philadelphia-protein philadelphia-protein-o-spalmabile-light
piadina|piadina
chicken-cooked|pollo-sfilacciato
tomato|pomodori pomodorini pomodoro pomodoro-grande
parsley|prezzemolo
ham|prosciutto-crudo
radicchio|radicchio-rosso
rice|riso-basmati riso-bianco riso-da-risotto riso-vialone-nano-o-carnaroli
arugula|rucola
salt|sale sale-all-aglio sale-fino sale-in-fiocchi sale-per-l-acqua-della-pasta
salmon|salmone-affumicato
bbq|salsa-aggiuntiva salsa-barbecue-0-kcal
cheese-sauce|salsa-al-formaggio-nacho
soy|salsa-di-soia-a-ridotto-sodio
enchilada|salsa-enchilada salsa-enchilada-rossa
ranch|salsa-ranch-proteica
sage|salvia
celery|sedano sedano-carota-e-cipolla
thyme|timo
tuna|tonno-al-naturale tonno-al-naturale-sgocciolato tonno-in-scatola
tortilla|tortilla tortilla-a-calorie-ridotte
egg|uovo
zucchini|verdure-miste zucchina
wine|vino-rosso
yogurt|yogurt-greco yogurt-greco-bianco-magro yogurt-greco-per-farcire
yogurt-vanilla|yogurt-greco-alla-vaniglia
ginger|zenzero-tritato
pumpkin|zucca'''
mapping={ingredient:profile for line in groups.splitlines() for profile,ingredients in [line.split('|')] for ingredient in ingredients.split()}
recipes=json.loads((root/'data/recipes.json').read_text(encoding='utf-8'))['recipes']
assert set(mapping)=={i['ingredientId'] for r in recipes for i in r['ingredients']}
out={'version':1,'datasetUrl':'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip','datasetSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'reviewedAt':'2026-10-30','profiles':profiles,'mapping':mapping}
(root/'src/nutrition-data.js').write_text('// Generato da scripts/build-nutrition-data.py. Tabelle di riferimento, non analisi delle ricette.\nexport const NUTRITION_DATA = '+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(f'{len(profiles)} profili con fonti, {len(mapping)} ingredienti mappati.')

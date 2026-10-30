"""Crea lo ZIP statico dalla build verificata, senza diario o file di lavoro."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import re

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
assert (dist / 'index.html').is_file(), 'Eseguire prima npm.cmd run build'
output = root / 'releases'
output.mkdir(exist_ok=True)
archive = output / 'coach-os-site.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as bundle:
    for path in sorted(dist.rglob('*')):
        assert not path.is_symlink(), 'Collegamenti non ammessi'
        if path.is_file():
            name = path.relative_to(dist).as_posix()
            assert name in ('index.html', '.nojekyll', 'src/barcode-license.txt') or re.fullmatch(r'(src/[a-z-]+\.(js|css)|assets/favicon\.svg|assets/recipes/recipe-source-\d{2}\.jpeg|data/(recipes|recipe-sources)\.json)', name), f'File inatteso: {name}'
            bundle.write(path, name)
with ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    assert 'index.html' in bundle.namelist()
    assert not any(name.startswith(('.git/', 'reference/', 'test-results/')) for name in bundle.namelist())
print(f'ZIP statico pronto: {archive}')

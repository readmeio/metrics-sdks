Update Version number in setup.py
`rm dist/*`
Building: `python3 setup.py sdist bdist_wheel`
Uploading to pypi: `python3 -m twine upload dist/*`
Useful guide: https://packaging.python.org/tutorials/packaging-projects/

## Development

### Install dependencies

```sh
# https://pypi.org/project/pipx/
brew install pipx

# https://virtualenv.pypa.io/en/latest/installation.html#via-pipx
pipx install virtualenv
# Create a virtual environment for dependencies to be installed into
virtualenv venv

# Go inside of the virtual environment
# https://www.freecodecamp.org/news/how-to-manage-python-dependencies-using-virtual-environments/
source ./venv/bin/activate

# Then finally install dependencies
pip install -r requirements.txt
```

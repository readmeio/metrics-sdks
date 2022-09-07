FROM python:3.10

COPY packages/python /src

# Set up the Python SDK
WORKDIR /src
RUN pip3 install --no-cache-dir -r requirements.txt

# Install Flask
WORKDIR /src/examples/flask
RUN pip3 install --no-cache-dir -r requirements.txt

CMD ["python3", "app.py"]

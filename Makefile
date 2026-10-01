.PHONY: setup ingest trace test run build clean

setup:
	python3 -m venv .venv
	.venv/bin/pip install --upgrade pip
	.venv/bin/pip install -r requirements.txt
	cd frontend && npm install && npm run build

ingest:
	.venv/bin/python bench/quick_ingest_test.py

detect:
	.venv/bin/python bench/quick_detect_test.py

trace:
	.venv/bin/python bench/quick_trace_test.py

legal:
	.venv/bin/python bench/quick_legal_test.py

build:
	cd frontend && npm run build

run:
	./run.sh

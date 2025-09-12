import chromadb
from chromadb.utils import embedding_functions
from PyPDF2 import PdfReader
import sys

# 1. Load PDF
reader = PdfReader("Sikkim_Tourism_Details.pdf")
documents = []
for idx, page in enumerate(reader.pages):
    text = page.extract_text()
    if text:
        documents.append(text)

# 2. Setup Chroma client
chroma_client = chromadb.PersistentClient(path="./Sikkim_Tourism_Details_db")

# 3. Define Ollama embedding function
ollama_ef = embedding_functions.OllamaEmbeddingFunction(
    model_name="embeddinggemma:latest",
    url="http://127.0.0.1:11434"
)

# 4. Create collection
collection = chroma_client.get_or_create_collection(
    name="Sikkim",
    embedding_function=ollama_ef
)

# 5. Insert data
try:
    for idx, text in enumerate(documents):
        collection.add(
            ids=[str(idx)],
            documents=[text]
        )
    print("✅ Sikkim data embedded successfully!")

except Exception as e:
    if "Failed to connect" in str(e):
        print("\n[Error] Could not connect to Ollama. Please ensure it's running.", file=sys.stderr)
    else:
        print(f"\n[Error] Unexpected error: {e}", file=sys.stderr)
    sys.exit(1)
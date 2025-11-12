from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Permite CORS para todas as rotas

# Configurações
DATA_FILE = 'task-data.json'
STATIC_FOLDER = '.'

def load_entries():
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Erro ao carregar entradas: {e}")
        return []

def save_entries(entries):
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Erro ao salvar entradas: {e}")
        return False

# Servir arquivos estáticos (HTML, CSS, JS)
@app.route('/')
def serve_index():
    return send_from_directory(STATIC_FOLDER, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(STATIC_FOLDER, filename)

# API Routes
@app.route('/api/entries', methods=['GET'])
def get_entries():
    """Retorna todas as entradas do diário"""
    try:
        entries = load_entries()
        return jsonify(entries), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/entries', methods=['POST'])
def save_entries_api():
    """Salva todas as entradas do diário"""
    try:
        data = request.get_json()
        if not isinstance(data, list):
            return jsonify({'error': 'Dados devem ser uma lista de entradas'}), 400
        
        # Validar estrutura das entradas
        for entry in data:
            required_fields = ['id', 'date', 'title', 'content']
            for field in required_fields:
                if field not in entry:
                    return jsonify({'error': f'Campo obrigatório ausente: {field}'}), 400
        
        if save_entries(data):
            return jsonify({'message': 'Entradas salvas com sucesso'}), 200
        else:
            return jsonify({'error': 'Erro ao salvar entradas'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/entries/<entry_id>', methods=['GET'])
def get_entry(entry_id):
    """Retorna uma entrada específica"""
    try:
        entries = load_entries()
        entry = next((e for e in entries if str(e['id']) == str(entry_id)), None)
        if entry:
            return jsonify(entry), 200
        else:
            return jsonify({'error': 'Entrada não encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/entries/<entry_id>', methods=['PUT'])
def update_entry(entry_id):
    """Atualiza uma entrada específica"""
    try:
        data = request.get_json()
        entries = load_entries()
        
        # Encontrar e atualizar a entrada
        for i, entry in enumerate(entries):
            if str(entry['id']) == str(entry_id):
                entries[i].update(data)
                if save_entries(entries):
                    return jsonify(entries[i]), 200
                else:
                    return jsonify({'error': 'Erro ao salvar entrada'}), 500
        
        return jsonify({'error': 'Entrada não encontrada'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/entries/<entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    """Deleta uma entrada específica"""
    try:
        entries = load_entries()
        original_length = len(entries)
        
        # Filtrar para remover a entrada
        entries = [e for e in entries if str(e['id']) != str(entry_id)]
        
        if len(entries) < original_length:
            if save_entries(entries):
                return jsonify({'message': 'Entrada deletada com sucesso'}), 200
            else:
                return jsonify({'error': 'Erro ao salvar após deletar'}), 500
        else:
            return jsonify({'error': 'Entrada não encontrada'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_entries():
    """Busca entradas por termo"""
    try:
        query = request.args.get('q', '').lower()
        if not query:
            return jsonify([]), 200
            
        entries = load_entries()
        results = []
        
        for entry in entries:
            if (query in entry['title'].lower() or 
                query in entry['content'].lower() or
                query in entry['date']):
                results.append(entry)
        
        return jsonify(results), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Retorna estatísticas do diário"""
    try:
        entries = load_entries()
        total_entries = len(entries)
        total_words = sum(len(entry['content'].split()) for entry in entries)
        
        # Estatísticas por ano
        years_stats = {}
        for entry in entries:
            year = entry['date'][:4]  # Assume formato YYYY-MM-DD
            if year not in years_stats:
                years_stats[year] = {'entries': 0, 'words': 0}
            years_stats[year]['entries'] += 1
            years_stats[year]['words'] += len(entry['content'].split())
        
        return jsonify({
            'total_entries': total_entries,
            'total_words': total_words,
            'years': years_stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint para verificar se o servidor está funcionando"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'message': 'Servidor do diário funcionando'
    }), 200

if __name__ == '__main__':
    # Verificar se o arquivo de dados existe, se não, criar um vazio
    if not os.path.exists(DATA_FILE):
        save_entries([])
        print(f"Arquivo {DATA_FILE} criado.")
    
    print(f"Servidor iniciando...")
    print(f"Arquivo de dados: {DATA_FILE}")
    print(f"Acesse: http://localhost:5001")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
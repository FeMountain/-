from flask import Flask, render_template, request, jsonify, send_from_directory
import os
from werkzeug.utils import secure_filename
from compare import SequenceComparer
import tempfile

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'temp_uploads'

# 确保临时上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'fasta', 'fa', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/compare', methods=['POST'])
def compare_sequences():
    try:
        # 获取上传的文件或粘贴的序列
        seq1_file = request.files.get('seq1_file')
        seq2_file = request.files.get('seq2_file')
        seq1_text = request.form.get('seq1_text', '').strip()
        seq2_text = request.form.get('seq2_text', '').strip()
        
        # 处理序列1
        if seq1_file and seq1_file.filename:
            if not allowed_file(seq1_file.filename):
                return jsonify({'error': '不支持的文件格式，请上传 .fasta, .fa 或 .txt 文件'}), 400
            seq1_content = seq1_file.read().decode('utf-8')
        else:
            seq1_content = seq1_text
        
        # 处理序列2
        if seq2_file and seq2_file.filename:
            if not allowed_file(seq2_file.filename):
                return jsonify({'error': '不支持的文件格式，请上传 .fasta, .fa 或 .txt 文件'}), 400
            seq2_content = seq2_file.read().decode('utf-8')
        else:
            seq2_content = seq2_text
        
        # 验证输入
        if not seq1_content or not seq2_content:
            return jsonify({'error': '请提供两个序列用于比对'}), 400
        
        # 创建比对器并执行比对
        comparer = SequenceComparer()
        result = comparer.compare_sequences(seq1_content, seq2_content)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'比对过程中出现错误: {str(e)}'}), 500

@app.route('/sample_data/<filename>')
def get_sample_data(filename):
    """提供示例数据下载"""
    sample_dir = 'sample_data'
    file_path = os.path.join(sample_dir, filename)
    
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return content, 200, {'Content-Type': 'text/plain'}
    else:
        return '文件不存在', 404

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 
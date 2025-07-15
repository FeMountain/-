from Bio import pairwise2
from Bio.Seq import Seq
from Bio import SeqIO
from io import StringIO
import re

class SequenceComparer:
    def __init__(self):
        self.alignments = None
    
    def parse_sequence(self, content):
        """解析FASTA格式或纯文本序列"""
        content = content.strip()
        
        # 尝试解析为FASTA格式
        if content.startswith('>'):
            try:
                # 使用BioPython解析FASTA
                fasta_io = StringIO(content)
                records = list(SeqIO.parse(fasta_io, "fasta"))
                if records:
                    return str(records[0].seq).upper()
            except:
                pass
        
        # 如果不是FASTA格式，直接处理为纯序列
        # 移除所有非字母字符（空格、换行、数字等）
        sequence = re.sub(r'[^A-Za-z]', '', content).upper()
        
        # 验证序列只包含有效的核苷酸或氨基酸字符
        valid_chars = set('ATCGUatcguNn')  # 核苷酸
        amino_chars = set('ACDEFGHIKLMNPQRSTVWYacdefghiklmnpqrstvwy')  # 氨基酸
        
        if all(c in valid_chars for c in sequence):
            return sequence
        elif all(c in amino_chars for c in sequence):
            return sequence
        else:
            raise ValueError("序列包含无效字符")
    
    def compare_sequences(self, seq1_content, seq2_content):
        """比对两个序列并返回结果"""
        try:
            # 解析序列
            seq1 = self.parse_sequence(seq1_content)
            seq2 = self.parse_sequence(seq2_content)
            
            if not seq1 or not seq2:
                raise ValueError("无法解析序列")
            
            # 执行全局比对
            alignments = pairwise2.align.globalms(seq1, seq2, 2, -1, -0.5, -0.1)
            
            if not alignments:
                raise ValueError("无法进行序列比对")
            
            # 获取最佳比对结果
            best_alignment = alignments[0]
            aligned_seq1, aligned_seq2, score, start, end = best_alignment
            
            # 计算相似度
            matches = sum(1 for a, b in zip(aligned_seq1, aligned_seq2) if a == b and a != '-')
            total_positions = len(aligned_seq1)
            similarity = (matches / total_positions) * 100 if total_positions > 0 else 0
            
            # 找出差异位置
            differences = []
            for i, (a, b) in enumerate(zip(aligned_seq1, aligned_seq2)):
                if a != b:
                    differences.append({
                        'position': i + 1,
                        'seq1_char': a,
                        'seq2_char': b,
                        'type': 'mismatch' if a != '-' and b != '-' else 'gap'
                    })
            
            # 生成可视化HTML
            visualization_html = self._generate_visualization(aligned_seq1, aligned_seq2, differences)
            
            return {
                'success': True,
                'similarity': round(similarity, 2),
                'total_positions': total_positions,
                'matches': matches,
                'differences': len(differences),
                'differences_detail': differences,
                'aligned_seq1': aligned_seq1,
                'aligned_seq2': aligned_seq2,
                'visualization': visualization_html,
                'score': score
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_visualization(self, seq1, seq2, differences):
        """生成序列比对的可视化HTML"""
        html_parts = ['<div class="sequence-visualization">']
        
        # 创建差异位置集合，用于快速查找
        diff_positions = {diff['position'] - 1 for diff in differences}
        
        # 生成序列1的可视化
        html_parts.append('<div class="sequence-line">')
        html_parts.append('<span class="sequence-label">序列1:</span>')
        for i, char in enumerate(seq1):
            if i in diff_positions:
                html_parts.append(f'<span class="difference">{char}</span>')
            else:
                html_parts.append(f'<span class="match">{char}</span>')
        html_parts.append('</div>')
        
        # 生成序列2的可视化
        html_parts.append('<div class="sequence-line">')
        html_parts.append('<span class="sequence-label">序列2:</span>')
        for i, char in enumerate(seq2):
            if i in diff_positions:
                html_parts.append(f'<span class="difference">{char}</span>')
            else:
                html_parts.append(f'<span class="match">{char}</span>')
        html_parts.append('</div>')
        
        # 生成比对指示线
        html_parts.append('<div class="alignment-line">')
        html_parts.append('<span class="sequence-label">比对:</span>')
        for i, (a, b) in enumerate(zip(seq1, seq2)):
            if a == b and a != '-':
                html_parts.append('<span class="match-indicator">|</span>')
            elif a != b:
                html_parts.append('<span class="mismatch-indicator">×</span>')
            else:
                html_parts.append('<span class="gap-indicator">-</span>')
        html_parts.append('</div>')
        
        html_parts.append('</div>')
        
        return ''.join(html_parts) 
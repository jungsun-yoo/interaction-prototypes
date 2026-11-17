"""개발 전달용 압축: 프로토타입 폴더 하나 + 그 HTML이 쓰는 공용 파일 → zip 하나

사용 (이 파일이 있는 _html/1st 에서):
    python3 pack.py                     # prototypes/aiPhotoAnalysis → download/aiPhotoAnalysis.zip
    python3 pack.py aiPhotoAnalysis --with-controls   # 옵션창(분석 시간 · 로딩만 보기)·QR 동기화까지 넣기
    python3 pack.py aiPhotoAnalysis --out ~/Desktop   # 다른 곳에 만들기

하는 일
 1) prototypes/<이름>/ 폴더를 통째로 담음 (interaction.md 포함)
 2) index.html 이 쓰는 ../src/… 공용 파일(common · components)만 찾아 zip 안 shared/ 에 넣고 경로를 고침
    → 압축을 풀고 index.html 을 바로 열면 됨
 3) 기본은 프로토타입 전용 장치를 뺌: 옵션창(css/controls.css) · QR/휴대폰 동기화(js/sync.js)
    빼면 폰 화면만 가운데 보이도록 css/layout.css 의 --phone-w 를 폰 너비로 바꿈
표준 라이브러리만 사용
"""
import argparse
import datetime
import os
import re
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
PROTO_ONLY = ['css/controls.css', 'js/sync.js']   # 옵션창 · 동기화 (테스트용)
SKIP_NAMES = {'.DS_Store'}
SKIP_DIRS = {'.omc'}


def strip_controls(html):
    """index.html 에서 옵션창 묶음과 프로토타입 전용 파일 연결을 뺌"""
    start = html.find('<div class="lens-controls">')
    if start != -1:
        line_start = html.rfind('\n', 0, start) + 1
        comment = html.rfind('<!-- 옵션창', 0, start)
        if comment != -1:
            line_start = html.rfind('\n', 0, comment) + 1
        depth, i = 0, start
        for m in re.finditer(r'<div\b|</div>', html[start:]):
            depth += 1 if m.group(0) == '<div' else -1
            if depth == 0:
                i = start + m.end()
                break
        end = html.find('\n', i) + 1
        html = html[:line_start] + html[end:]
    for name in PROTO_ONLY:
        html = re.sub(r'[ \t]*<(?:link|script)[^>]*\./' + re.escape(name) + r'[^>]*>(?:</script>)?[^\n]*\n', '', html)
    return html


def shared_refs(text):
    """../src/… 로 시작하는 참조 (쿼리 ?v= 앞까지)"""
    return sorted(set(re.findall(r'\.\./src/([^"\'?)\s]+)', text)))


def main():
    ap = argparse.ArgumentParser(description='프로토타입 하나를 개발 전달용 zip 으로')
    ap.add_argument('name', nargs='?', default='aiPhotoAnalysis', help='prototypes/ 아래 폴더 이름')
    ap.add_argument('--with-controls', action='store_true', help='옵션창 · QR 동기화까지 넣기')
    ap.add_argument('--out', default=os.path.join(HERE, 'download'), help='zip 을 만들 폴더')
    args = ap.parse_args()

    src_dir = os.path.join(HERE, 'prototypes', args.name)
    common_dir = os.path.join(HERE, 'prototypes', 'src')
    if not os.path.isfile(os.path.join(src_dir, 'index.html')):
        sys.exit('prototypes/%s/index.html 이 없어요' % args.name)

    skip = set() if args.with_controls else set(PROTO_ONLY)
    os.makedirs(os.path.expanduser(args.out), exist_ok=True)
    zip_path = os.path.join(os.path.expanduser(args.out), args.name + '.zip')
    root = args.name + '/'
    needed = set()
    missing = []

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for folder, dirs, files in os.walk(src_dir):
            dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
            for f in sorted(files):
                if f in SKIP_NAMES:
                    continue
                path = os.path.join(folder, f)
                rel = os.path.relpath(path, src_dir).replace(os.sep, '/')
                if rel in skip:
                    continue
                if rel.endswith(('.html', '.css', '.js', '.md')):
                    text = open(path, encoding='utf-8').read()
                    if rel == 'index.html':
                        text = re.sub(r'\sdata-index-path="[^"]*"', ' data-index-path=""', text)   # zip 에는 인덱스가 없음 → 제목 읽기 생략
                        if not args.with_controls:
                            text = strip_controls(text)
                    if rel == 'css/layout.css' and not args.with_controls:
                        text = re.sub(r'--phone-w:\s*\d+px;', '--phone-w: 390px;', text, count=1)
                    if not rel.endswith('.md'):          # 명세 안 경로 글자는 파일 참조가 아님
                        needed.update(shared_refs(text))
                    text = text.replace('../src/', './shared/')
                    z.writestr(root + rel, text)
                else:
                    z.write(path, root + rel)

        # 공용 파일: 참조된 것 + 그 CSS 안에서 다시 참조하는 같은 폴더 파일
        queue = list(needed)
        done = set()
        while queue:
            rel = queue.pop()
            if rel in done:
                continue
            done.add(rel)
            path = os.path.join(common_dir, rel)
            if not os.path.isfile(path):
                missing.append(rel)
                continue
            if rel.endswith('.css'):
                text = open(path, encoding='utf-8').read()
                for u in re.findall(r'url\(["\']?(?!data:|https?:)([^"\')]+)', text):
                    queue.append(os.path.normpath(os.path.join(os.path.dirname(rel), u)).replace(os.sep, '/'))
            z.write(path, root + 'shared/' + rel)

        z.writestr(root + 'README.txt',
                   'AI 렌즈 프로토타입 — %s\n만든 날: %s\n\n'
                   '- index.html 을 브라우저로 열면 됩니다 (Chrome · Safari).\n'
                   '- 인터랙션 명세: interaction.md\n'
                   '- 조절 값: css/values.css (명세 절 순서와 같음)\n'
                   '- shared/: 다른 프로토타입과 같이 쓰는 공용 파일 (MDS 모션 토큰, AI 로딩 아이콘)\n%s'
                   % (args.name, datetime.date.today().isoformat(),
                      '' if args.with_controls else '- 옵션창 · QR 동기화(프로토타입 전용)는 뺐습니다. 새로고침하면 처음부터 다시 재생됩니다.\n'))

    print('만들었어요:', zip_path)
    print('공용 파일 %d개 포함' % len(done - set(missing)))
    if missing:
        print('없는 공용 파일:', ', '.join(missing))
        sys.exit(1)


if __name__ == '__main__':
    main()

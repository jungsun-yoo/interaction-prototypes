"""개발 전달용 압축: 프로토타입 폴더 하나 + 그 HTML이 쓰는 공용 파일 → zip 하나

사용 (이 파일이 있는 _html/1st 에서):
    python3 pack.py                     # prototypes/aiPhotoAnalysis → download/aiPhotoAnalysis.zip
    python3 pack.py aiPhotoAnalysis --out ~/Desktop   # 다른 곳에 만들기

하는 일
 1) prototypes/<이름>/ 폴더를 통째로 담음 (interaction.md 포함)
 2) index.html 이 쓰는 ../src/… 공용 파일(common · components)만 찾아 zip 안 shared/ 에 넣고 경로를 고침
    → 압축을 풀고 index.html 을 바로 열면 됨
 3) 페이지 로딩을 끔: index.html <html> 에 data-loading="off" (로딩은 보기용)
 4) 옵션창은 인덱스 오른쪽 카드라(index.html items[].options) 프로토타입 폴더에 없음 → 따로 뺄 것 없음
표준 라이브러리만 사용
"""
import argparse
import datetime
import os
import re
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
SKIP_NAMES = {'.DS_Store'}
SKIP_DIRS = {'.omc'}


def shared_refs(text):
    """../src/… 로 시작하는 참조 (쿼리 ?v= 앞까지)"""
    return sorted(set(re.findall(r'\.\./src/([^"\'?)\s]+)', text)))


def main():
    ap = argparse.ArgumentParser(description='프로토타입 하나를 개발 전달용 zip 으로')
    ap.add_argument('name', nargs='?', default='aiPhotoAnalysis', help='prototypes/ 아래 폴더 이름')
    ap.add_argument('--out', default=os.path.join(HERE, 'download'), help='zip 을 만들 폴더')
    args = ap.parse_args()

    src_dir = os.path.join(HERE, 'prototypes', args.name)
    common_dir = os.path.join(HERE, 'prototypes', 'src')
    if not os.path.isfile(os.path.join(src_dir, 'index.html')):
        sys.exit('prototypes/%s/index.html 이 없어요' % args.name)

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
                if rel.endswith(('.html', '.css', '.js', '.md')):
                    text = open(path, encoding='utf-8').read()
                    if rel == 'index.html':
                        text = re.sub(r'\sdata-index-path="[^"]*"', ' data-index-path=""', text)   # zip 에는 인덱스가 없음 → 제목 읽기 생략
                        # 페이지 로딩 끄기 (로딩은 프로토타입 '보기용'이라 개발 전달물에는 넣지 않음 · 공유 틀 tools/make_prototype_zip.py 와 같은 규칙)
                        text, n = re.subn(r'<html\b[^>]*>', lambda m: re.sub(r'\sdata-loading="[^"]*"', '', m.group(0))[:-1].rstrip() + ' data-loading="off">', text, count=1)
                        if n != 1:
                            sys.exit('index.html 에서 <html> 태그를 못 찾았어요')
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
                   '- shared/: 다른 프로토타입과 같이 쓰는 공용 파일 (MDS 모션 토큰, AI 로딩 아이콘)\n'
                   '- 새로고침하면 처음부터 다시 재생됩니다 (옵션 카드 · QR 동기화는 인덱스 전용이라 들어 있지 않음).\n'
                   % (args.name, datetime.date.today().isoformat()))

    print('만들었어요:', zip_path)
    print('공용 파일 %d개 포함' % len(done - set(missing)))
    if missing:
        print('없는 공용 파일:', ', '.join(missing))
        sys.exit(1)


if __name__ == '__main__':
    main()

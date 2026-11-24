"""개발 전달용 압축: prototype/ 폴더 → download/prototype.zip

사용 (이 파일이 있는 _html/1st 에서):
    python3 pack.py                   # download/prototype.zip
    python3 pack.py --out ~/Desktop   # 다른 곳에 만들기
    python3 pack.py --screen aiPhotoAnalysis   # 화면 하나만 → download/aiPhotoAnalysis.zip (그 화면 폴더 + 공용 src/)
                                               #  AI 사진 분석 옵션창 위 FILES 카드의 Download (.zip) 이 이 파일

하는 일
 1) prototype/ 폴더를 통째로 담음 (AI 로딩 아이콘 · AI 사진 분석 + aiPhotoAnalysis_interaction-guide.md + 공용 src/)
    --screen 이면 그 화면 폴더(prototype/<화면>/) + 공용 src/ 만
 2) AI 로딩 아이콘 설명창의 CSS zip 링크(../download/IconAILoading-img-css.zip)가 풀어서도 열리게 download/ 에 같이 넣음
 3) 옵션창은 인덱스 오른쪽 카드라(index.html items[].options) 프로토타입 폴더에 없음 → 따로 뺄 것 없음
 4) 받은 원본 이미지(img/_source) · 작업 파일(.omc, _dbg*) 은 넣지 않음
 5) 압축을 풀고 파일로 바로 열어도(file://) 되게: AI 로딩 아이콘 로티 json 을 HTML 안에 넣고,
    공용 common.js 의 옵션 실시간 연결은 http 로 열 때만 (원본 파일은 그대로, zip 안 사본만 바꿈)
 6) 페이지 로딩을 끔: 각 HTML <html> 에 data-loading="off" (로딩은 프로토타입 '보기용'이라 개발 전달물에는 넣지 않음.
    꺼도 진입 모션 · 분석 타이머 · 뒤에서 받기는 그대로 — common.js protoReady 가 바로 '준비 끝'으로 처리)
표준 라이브러리만 사용
"""
import argparse
import datetime
import os
import re
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))


def turn_off_loading(match):
    """<html ...> 태그에 data-loading="off" 를 넣음 (이미 있으면 off 로 바꿈)"""
    tag = match.group(0)
    if re.search(r'\bdata-loading\s*=', tag):
        return re.sub(r'\bdata-loading\s*=\s*"[^"]*"', 'data-loading="off"', tag)
    return tag[:-1].rstrip() + ' data-loading="off">'
PROTO = os.path.join(HERE, 'prototype')
PHOTO = 'aiPhotoAnalysis/'
EXTRA = ['download/IconAILoading-img-css.zip']                      # 프로토타입 안에서 링크하는 파일
LOTTIE = 'src/components/IconAILoading/lottie/IconAILoading.json'   # aiLoading.html 이 읽는 로티
SKIP_NAMES = {'.DS_Store'}
SKIP_DIRS = {'.omc', '_source', '__pycache__'}


def main():
    ap = argparse.ArgumentParser(description='prototype/ 폴더를 개발 전달용 zip 으로')
    ap.add_argument('--out', default=os.path.join(HERE, 'download'), help='zip 을 만들 폴더')
    ap.add_argument('--screen', help='화면 폴더 하나만 (예: aiPhotoAnalysis) → <화면>.zip')
    args = ap.parse_args()
    if args.screen and not os.path.isdir(os.path.join(PROTO, args.screen)):
        sys.exit('없는 화면 폴더: prototype/' + args.screen)

    out_dir = os.path.expanduser(args.out)
    os.makedirs(out_dir, exist_ok=True)
    zip_path = os.path.join(out_dir, (args.screen or 'prototype') + '.zip')
    count = 0

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for folder, dirs, files in os.walk(PROTO):
            dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
            for f in sorted(files):
                if f in SKIP_NAMES or f.startswith('_dbg'):
                    continue
                path = os.path.join(folder, f)
                rel = os.path.relpath(path, PROTO).replace(os.sep, '/')
                if args.screen and not rel.startswith((args.screen + '/', 'src/')):
                    continue   # 화면 하나만: 그 화면 폴더 + 공용 src/
                arc = 'prototype/' + rel
                if rel.endswith(('.html', '.css', '.js')):
                    text = open(path, encoding='utf-8').read()
                    if rel.endswith('.html'):
                        # zip 에는 인덱스가 없음 → 인덱스에서 제목 읽기 생략
                        if 'data-index-path=' in text:
                            text = re.sub(r'\sdata-index-path="[^"]*"', ' data-index-path=""', text)
                        else:
                            text = text.replace('<html lang="ko"', '<html lang="ko" data-index-path=""', 1)
                        # 페이지 로딩 끄기 (공통 도구 tools/make_prototype_zip.py 와 같은 규칙)
                        text, n = re.subn(r'<html\b[^>]*>', turn_off_loading, text, count=1)
                        if n != 1:
                            sys.exit(rel + ' 에서 <html> 태그를 못 찾았어요')
                    if rel == 'aiLoading.html':
                        # 파일로 바로 열면(file://) 브라우저가 로티 json 을 못 읽음 → zip 에서는 json 을 HTML 안에 넣음
                        data = open(os.path.join(PROTO, LOTTIE), encoding='utf-8').read().strip()
                        text, n = re.subn(r"path:\s*'" + re.escape(LOTTIE) + r"[^\n]*", lambda m: 'animationData: ' + data + ' /* ' + LOTTIE + ' 내용 */', text)
                        if n != 1:
                            sys.exit('aiLoading.html 에서 로티 path 를 못 찾았어요')
                    if rel == 'src/common/common.js':
                        # 파일로 바로 열면 옵션 실시간 연결(/api/options/stream)이 오류만 냄 → http 일 때만
                        text, n = re.subn(r'if \(!inIndex && window\.EventSource\)', "if (!inIndex && window.EventSource && /^https?:$/.test(location.protocol))", text)
                        if n != 1:
                            sys.exit('common.js 에서 EventSource 줄을 못 찾았어요')
                    z.writestr(arc, text)
                else:
                    z.write(path, arc)
                count += 1

        for rel in ([] if args.screen else EXTRA):
            path = os.path.join(HERE, rel)
            if not os.path.isfile(path):
                sys.exit('없는 파일: ' + rel)
            z.write(path, rel)
            count += 1

        z.writestr('README.txt',
                   '무신사 렌즈 프로토타입\n만든 날: %s\n\n%s'
                   '- prototype/aiPhotoAnalysis/index.html: AI 사진 분석 (분석 중 → 분석 완료)\n'
                   '- 인터랙션 가이드: prototype/aiPhotoAnalysis/aiPhotoAnalysis_interaction-guide.md\n'
                   '- 조절 값: prototype/aiPhotoAnalysis/css/values.css (가이드 절 순서와 같음)\n'
                   '- prototype/src/: 같이 쓰는 공용 파일 (MDS 모션 토큰, AI 로딩 아이콘)\n'
                   '- html 파일을 브라우저(Chrome · Safari)로 열면 됩니다.\n'
                   '- AI 사진 분석은 6초 뒤 결과 화면으로 넘어가고, 새로고침하면 처음부터 다시 재생됩니다 (옵션 카드 · QR 동기화는 인덱스 전용이라 들어 있지 않음).\n'
                   % (datetime.date.today().isoformat(),
                      '' if args.screen else '- prototype/aiLoading.html: AI 로딩 아이콘 (로티 · IMG CSS 비교, 오른쪽 설명창에서 파일 받기)\n'))

    print('만들었어요:', zip_path)
    print('파일 %d개 + README.txt' % count)


if __name__ == '__main__':
    main()

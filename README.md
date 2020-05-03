# bata_sequencer
bata drum sequencer using Web Audio API and Tone.js

Tone.jsライブラリ経由でWeb Audio APIを利用したドラムシーケンサーです。<br>
リズムパターンの練習・研究・教育を目的に
キューバのBata Drumという太鼓のアンサンブルをシミュレートしています。<br>
[Bata Sequencer](https://ryjkmr.github.io/bata_sequencer/)<br>

演奏データはテーブル上のチェックボックスのオンオフで設定します<br>
Tone.jsのシーケンサーで一定間隔で呼ばれる関数から、テーブルのチェックボックスを読み取り、対応するサンプリング音源を鳴らします<br>
Tone.jsの使い方については、[Tone.js & CodePen Part 02 - Step Sequencer](https://www.youtube.com/watch?v=Dxxkma4F-oA&t=19s)を参考にしました<br>


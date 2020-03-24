'use strict';

//演奏が始まらない現象を防ぐおまじない？
document.documentElement.addEventListener('mousedown', () => {
  if (Tone.context.state !== 'running') Tone.context.resume();
});

Tone.Transport.bpm.value = 120;//テンポ設定
Tone.Transport.scheduleRepeat(repeat, '8n');//"8n"が来る度に'repeat'関数が呼び出される

const SOUND_FILE_DIR = 'audio/';
let sequence_length = 0;
let last_played_score = {};//最後に演奏したデータをクッキーから取得するためのオブジェクト

const soundsUrlList = [
  'clave.wav',
  'okonkoro_cha.wav',
  'okonkoro_low.wav',
  'iya_cha.wav',
  'iya_mute.wav',
  'iya_low.wav',
  'itotore_cha.wav',
  'itotore_mute.wav',
  'itotore_low.wav'
];
const sounds = soundsUrlList.map(url => new Tone.Sampler({ C4: SOUND_FILE_DIR + url }).toMaster());//Tone.jsにサンプラー音源をセット。最初にやらないとエラーになる

const SCORE_DATA = [ //楽器と譜面をセットにしたデータ
  //音源ファイル名も含めることで、色んな楽器に対応させる予定だったが、Tone.jsのバッファエラーが出てうまくいかないので、今はバタ専用仕様。ファイル名も利用されていない
  {
    "instrumentName": "clave", "sounds": [
      { "name": "clave", "notes": [true, false, false, true, false, false, false, true, false, false, true, false, true, false, false, false], "filename": "clave.wav" }]
  },
  {
    "instrumentName": "okonkoro", "sounds": [
      { "name": "slap", "notes": [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false], "filename": "okonkoro_cha.wav" },
      { "name": "open", "notes": [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], "filename": "okonkoro_low.wav" }]
  },
  {
    "instrumentName": "iya", "sounds": [
      { "name": "slap", "notes": [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false], "filename": "iya_cha.wav" },
      { "name": "mute", "notes": [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], "filename": "iya_mute.wav" },
      { "name": "open", "notes": [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], "filename": "iya_low.wav" }]
  },
  {
    "instrumentName": "itotore", "sounds": [
      { "name": "slap", "notes": [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, true], "filename": "itotore_cha.wav" },
      { "name": "mute", "notes": [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false], "filename": "itotore_mute.wav" },
      { "name": "open", "notes": [false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false], "filename": "itotore_low.wav" }]
  }];


$(document).ready(function () {

  //シーケンサーテーブルを表示、クッキーに過去データがあればそれを表示、なければ新規テーブルを表示
  if ($.cookie('last_played_score')) {
    last_played_score = JSON.parse($.cookie('last_played_score'));
    const sequence_table_data = createScoreTableFromData(last_played_score);
    document.getElementById("score_table").innerHTML = sequence_table_data.html;
    sequence_length = sequence_table_data.num;
    eraseCheckeboxChecked(document.getElementById("score_table"));
  } else {
    const sequence_table_data = createScoreTableFromData(SCORE_DATA);
    document.getElementById("score_table").innerHTML = sequence_table_data.html;
    sequence_length = sequence_table_data.num;
    eraseCheckeboxChecked(document.getElementById("score_table"));
  }

  tableToPlay = document.querySelector('.score_table');//テーブルを演奏対象オブジェクトにセット

  $('#tempo_disp').val($('#tempo_slider').val());

  $('#getTable').click(function (e) {
    getSoundUrlListFromTable($(this).parent().find('table')[0]);
  });

  setStartBtnAction();

  function setStartBtnAction() {
    $('.startBtn').click(function (e) {
      tableToPlay = $(this).parent().find('table')[0];//同じdiv内にあるテーブルを演奏対象オブジェクトにセット
      //$.cookie('last_played_score', JSON.stringify(getScoreDataFromScoreTable(tableToPlay)));
      Tone.Transport.seconds = 0;
      Tone.Transport.start();
      $(this).val('pause');
      $(this).addClass('pauseBtn');
      $(this).removeClass('startBtn');
      setPauseBtnAction();
    });
  }

  function setRestartBtnAction() {
    $('.restartBtn').click(function (e) {
      $(this).val('pause');
      $(this).addClass('pauseBtn');
      $(this).removeClass('restartBtn');
      setPauseBtnAction();
      Tone.Transport.start();
    });
  }

  function setPauseBtnAction() {
    $('.pauseBtn').click(function (e) {
      Tone.Transport.pause();
      $(this).val('restart');
      $(this).addClass('restartBtn');
      $(this).removeClass('pauseBtn');
      setRestartBtnAction();
    });
  }

  function resetStartBtn(that) { //スタートボタンの機能と名前をリセット
    $(that).parent().find('.pauseBtn').val('start');
    $(that).parent().find('.pauseBtn').addClass('startBtn');
    $(that).parent().find('.pauseBtn').removeClass('pauseBtn');
    $(that).parent().find('.restartBtn').val('start');
    $(that).parent().find('.restartBtn').addClass('startBtn');
    $(that).parent().find('.restartBtn').removeClass('restartBtn');
    setStartBtnAction();
  }

  $('.stopBtn').click(function (e) {
    stop(this);
    resetStartBtn(this);
  });

  $('.increaseCellBtn').click(function (e) {
    stop(this);
    resetStartBtn(this);
    if (sequence_length > 47) return;
    sequence_length++;
    const tableToIncrease = $(this).parent().find('table')[0];
    const note_backup = Array.from(tableToIncrease.querySelectorAll('td.note_cell > input')).map(arr => { return arr.checked });
    const regExp = /(<td class=\"note_cell\"><input type=\"checkbox\"><\/td>)(\s+<\/tr>)/g;
    tableToIncrease.innerHTML = tableToIncrease.innerHTML.replace(regExp, '$1\n$1$2');
    const regExpHead = /(<\/tr>\s?<\/thead>)/g;
    tableToIncrease.innerHTML = tableToIncrease.innerHTML.replace(regExpHead, '<th>' + sequence_length + '<\/th>$1');
    const new_note_inputs = tableToIncrease.querySelectorAll('td.note_cell > input');
    let i = 0;
    new_note_inputs.forEach((note, index) => {
      if (index === 0 || (index + 1) % sequence_length !== 0) {
        note.checked = note_backup[i];
        i++;
      }
    });
  });


  $('.decreaseCellBtn').click(function (e) {
    stop(this);
    if (sequence_length < 3) return;
    sequence_length--;
    const tableToDecrease = $(this).parent().find('table')[0];
    const note_backup = Array.from(tableToDecrease.querySelectorAll('td.note_cell > input')).map(arr => { return arr.checked });
    const regExp = /<td class=\"note_cell\"><input type=\"checkbox\"><\/td>(\s+<\/tr>)/g;
    tableToDecrease.innerHTML = tableToDecrease.innerHTML.replace(regExp, '$1');

    const regExpHead = /(<th>\d+<\/th>)(\s?<\/tr>\s?<\/thead>)/g;
    tableToDecrease.innerHTML = tableToDecrease.innerHTML.replace(regExpHead, '$2');

    const new_note_inputs = tableToDecrease.querySelectorAll('td.note_cell > input');
    let i = 0;
    new_note_inputs.forEach((note, index) => {
      note.checked = note_backup[i];
      if ((index + 1) % sequence_length == 0) {
        i += 2;
      } else {
        i++;
      }
    });
  });

  $('.clearBtn').click(function (e) {
    stop(this);
    resetStartBtn(this);
    if (window.confirm('全てのデータをクリアします')) {
      const tableToClear = $(this).parent().find('table')[0];
      const note_inputs = tableToClear.querySelectorAll('td.note_cell > input');
      note_inputs.forEach((note, index) => {
        note.checked = false;
      });
    }
  });

  $('.ChaChaBtn').click(function (e) {
    stop(this);
    resetStartBtn(this);
    if (window.confirm('全てのデータをクリアしてチャチャロカフンに設定します')) {
      const tableToReset = $(this).parent().find('table')[0];
      const sequence_table_data = createScoreTableFromData(SCORE_DATA);
      tableToReset.innerHTML = sequence_table_data.html;
      sequence_length = sequence_table_data.num;
      eraseCheckeboxChecked(tableToReset);
    }
  });

  $('.eraseCheckedBtn').click(function (e) {
    eraseCheckeboxChecked();
  });


  $('.loadCookieBtn').click(function (e) {
    if (window.confirm('最後に再生したデータで上書きします')) {
      last_played_score = JSON.parse($.cookie('last_played_score'));
      if (last_played_score) {
        const sequence_table_data = createScoreTableFromData(last_played_score);
        document.getElementById("score_table").innerHTML = sequence_table_data.html;
        sequence_length = sequence_table_data.num;
        eraseCheckeboxChecked(document.getElementById("score_table"));
      }
    }
  });

  $('#tempo_slider').on('input', function (e) {
    const tempo = $(this).val();
    $('#tempo_disp').val(tempo);
    Tone.Transport.bpm.value = tempo;
  });

});

//JSONデータから譜面テーブルを描画する関数。
//howManyCellsに1以上の数を指定すると空の譜面を作る。howManyCellsが無い場合は、オブジェクトのnotes配列に従って描画
function createScoreTableFromData(instruments, howManyCells) { //楽器リストに基づいてシーケンサーのテープルを作る関数

  const ON_CELL_HTML = '<td class="note_cell" ><input type="checkbox" checked="checked"/></td>\n';//チェックボックスON
  const OFF_CELL_HTML = '<td class="note_cell" ><input type="checkbox" /></td>\n';//チェックボックスOFF
  const MUTE_BTN = '<input class="mute_btn" type="checkbox" checked="checked"/>';//ミュートボタン

  let tableHtml = '<table id="scoreTable" class="table_color">\n{replace_later}<tbody>\n';//この変数にHTMLタグを追加していく
  const isNewScoreTableReq = howManyCells !== undefined && howManyCells > 0;//第2引数の有無と有効性をチェック。第2引数があると空の譜面を作る
  instruments.forEach(instrument => {
    tableHtml += '<tr class="instrument">\n';
    if (instrument.sounds.length === 1) { //楽器の音色がひとつだけの場合、レイアウトが違う。colspanで横2枠を繋げる
      tableHtml += `<td  colspan="2" class="instrumentName  soundName" data-filename="${instrument.sounds[0].filename}">${MUTE_BTN}${instrument.instrumentName}</td>\n`;
      if (isNewScoreTableReq) {
        tableHtml += OFF_CELL_HTML.repeat(howManyCells);
      } else {
        tableHtml += instrument.sounds[0].notes.join(' ').replace(/true/g, ON_CELL_HTML).replace(/false/g, OFF_CELL_HTML);
      }
      tableHtml += '</tr>\n';
    } else { //楽器の音色が2つ以上ある場合。1行目だけはレイアウト上、rowspanを入れるために別処理になっている
      tableHtml += `<td rowspan="${instrument.sounds.length}" class="instrumentName">${MUTE_BTN}${instrument.instrumentName}</td>\n`;
      tableHtml += `<td class="soundName" data-filename="${instrument.sounds[0].filename}">${instrument.sounds[0].name}</td>\n`;
      if (isNewScoreTableReq) {
        tableHtml += OFF_CELL_HTML.repeat(howManyCells);
      } else {
        tableHtml += instrument.sounds[0].notes.join(' ').replace(/true/g, ON_CELL_HTML).replace(/false/g, OFF_CELL_HTML);
      }
      tableHtml += '</tr>\n';
      for (let i = 1; i < instrument.sounds.length; i++) {
        tableHtml += '<tr class="instrument">\n';
        tableHtml += `<td class="soundName" data-filename="${instrument.sounds[i].filename}">${instrument.sounds[i].name}</td>\n`;
        if (isNewScoreTableReq) {
          tableHtml += OFF_CELL_HTML.repeat(howManyCells);
        } else {
          tableHtml += instrument.sounds[i].notes.join(' ').replace(/true/g, ON_CELL_HTML).replace(/false/g, OFF_CELL_HTML);
        }
        tableHtml += '</tr>\n';
      }
    }
  });
  tableHtml += '</tbody>\n</table>\n';
  if (isNewScoreTableReq) {
    let cellNo = '';//表の数に応じたヘッダーを付ける
    for (let i = 1; i <= howManyCells; i++) { cellNo += `<th>${i}</th>`; }
    const headHtml = `<thead><tr><th colspan="2"></th>${cellNo}</tr></thead>`;
    tableHtml = tableHtml.replace(/{replace_later}/g, headHtml);
    return { html: tableHtml, num: howManyCells };
  } else {
    let cellNo = '';//表の数に応じたヘッダーを付ける
    for (let i = 1; i <= instruments[0].sounds[0].notes.length; i++) { cellNo += `<th>${i}</th>`; }
    const headHtml = `<thead><tr><th colspan="2"></th>${cellNo}</tr></thead>`;
    tableHtml = tableHtml.replace(/{replace_later}/g, headHtml);
    return { html: tableHtml, num: instruments[0].sounds[0].notes.length };
  }
}

function getScoreDataFromScoreTable(table) {
  const scoreTable = table.querySelectorAll('.instrument');
  const scoreDataFromScoreTable = [];
  let partDatafromTableRow = {};

  scoreTable.forEach((part_row, index) => {
    const instrumentName = part_row.querySelector('.instrumentName');
    if (instrumentName) {
      if (index > 0) scoreDataFromScoreTable.push(partDatafromTableRow);//データをpushするのは2周目から
      partDatafromTableRow = { instrumentName: instrumentName.textContent, sounds: [] };
    }

    const sound_row = part_row.querySelector('.soundName');
    const notes = Array.from(part_row.querySelectorAll('td.note_cell > input')).map(arr => { return arr.checked });
    const sound = { name: sound_row.textContent, notes: notes, filename: sound_row.dataset.filename };
    partDatafromTableRow.sounds.push(sound);
  });
  scoreDataFromScoreTable.push(partDatafromTableRow);
  return scoreDataFromScoreTable;
}

function getSoundUrlListFromTable(table) { //Tone.jsに渡すサンプラー音源のURLリストを配列で返す
  const scoreTable = table.querySelectorAll('.instrument');
  const soundUrlListObj = {};
  const soundUrlListArray = [];
  let instNameTemp = '';
  scoreTable.forEach((part_row, index) => {
    const instrumentName = part_row.querySelector('.instrumentName');
    if (instrumentName) {
      instNameTemp = instrumentName.textContent;
    }
    const sound_row = part_row.querySelector('.soundName');
    const soundname_and_filname = instNameTemp + '_' + sound_row.textContent;
    soundUrlListObj[soundname_and_filname] = SOUND_FILE_DIR + sound_row.dataset.filename;
    soundUrlListArray.push(SOUND_FILE_DIR + sound_row.dataset.filename);
  });
  return soundUrlListArray;
}



function getNotesAndPlay(count, time) {
  const instrument_parts = tableToPlay.querySelectorAll('.instrument');
  let isNotMuted = true;
  instrument_parts.forEach((part, index) => {
    const instrumentName = part.querySelector('.instrumentName');
    if (instrumentName) {
      isNotMuted = part.querySelector('.mute_btn').checked;
    }
    const isNoteOn = part.querySelectorAll('td.note_cell > input')[count].checked;
    if (isNoteOn && isNotMuted) {
      sounds[index].triggerAttackRelease("C4", "8n", time);
    }
  });
}

function changeColorOfCell(count, howManyCells) {
  const cells = tableToPlay.querySelectorAll('.note_cell');
  for (let i = count % howManyCells; i < cells.length; i += howManyCells) {
    cells[i].classList.toggle('currentTimeCell');
  }
}

function clearColorOfCell(count, howManyCells) {
  const cells = tableToPlay.querySelectorAll('.note_cell');
  for (let i = count % howManyCells; i < cells.length; i += howManyCells) {
    cells[i].classList.remove('currentTimeCell');
  }
}

function clearColorOfAllCells() {
  const cells = tableToPlay.querySelectorAll('.note_cell');
  for (let i = 0; i < cells.length; i++) {
    cells[i].classList.remove('currentTimeCell');
  }
}

let indexOfPlayingCell = 0;//演奏するセルの番号、repeat関数内で参照する
let tableToPlay = {};//演奏対象となるテーブルを入れる

function repeat(time) {
  const currentStep = indexOfPlayingCell % sequence_length;
  getNotesAndPlay(currentStep, time);
  changeColorOfCell(currentStep, sequence_length);
  const lastStep = currentStep === 0 ? sequence_length - 1 : currentStep - 1;
  clearColorOfCell(lastStep, sequence_length);
  indexOfPlayingCell++;
}

function stop(that) {
  tableToPlay = $(that).parent().find('table')[0];//同じdiv内にあるテーブルを演奏対象オブジェクトにセット
  $.cookie('last_played_score', JSON.stringify(getScoreDataFromScoreTable(tableToPlay)));
  Tone.Transport.stop();
  Tone.Transport.cancel();
  clearColorOfAllCells();
  indexOfPlayingCell = 0;
}


function eraseCheckeboxChecked(target) { //セル数の増減処理を楽にするために、checked="checked"無しのデータに変換する
  const note_backup = Array.from(target.querySelectorAll('td.note_cell > input')).map(arr => { return arr.checked });
  const note_cells = target.querySelectorAll('td.note_cell');
  note_cells.forEach((e, index, array) => {
    array[index].innerHTML = array[index].innerHTML.replace(/ checked=\"checked\"/g, '');
  });
  const note_inputs = target.querySelectorAll('td.note_cell > input');

  for (let i = 0; i < note_inputs.length; i++) {
    note_inputs[i].checked = note_backup[i];
  }
}



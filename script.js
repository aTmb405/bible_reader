const state = {
    key: 'API_KEY',
    version: 'ENGESV',
    currentBook: 'Luke',
    currentBookId: 'Luke',
    currentChapter: 1,
    books: {},
    timestamps: [],
}

document.addEventListener('DOMContentLoaded', app);

async function app() {
    const booksList = await fetchBooks(state.key, state.version);
    const bookData = state.books[`${state.currentBookId}`];
    const damId = bookData.dam_id;

    navbar(damId, booksList, bookData);
    text(damId);
}

const navbar = async (damId, booksList, bookData) => {
    audioPlayer(damId);
    selectors(booksList, bookData);
}

const text = async (damId) => {
    const text = await fetchText(damId);

    displayText(text);
    handleTextClick();
    handleTextHighlighting();
}

const audioPlayer = async (damId) => {
    const audioData = await fetchAudio(damId);
    state.timestamps = await fetchVerseTimestamps(damId);
    const audio = document.querySelector('#listener');

    setAudioSrc(audio, audioData);
    handleAudioPlayerChange(audio);
}

const selectors = (booksList, bookData) => {
    const { currentBookId, currentChapter } = state;

    setCurrentBook(currentBookId);
    setCurrentChapter(currentChapter);

    displayBooks(booksList);
    displayChapters(bookData);
    handleChapterChange();
}

const displayText = (textArray) => {
    const paragraph = document.querySelector('#paragraph');

    paragraph.innerHTML = '';
    textArray.forEach(text => {
        if (isArabic()) paragraph.setAttribute('dir', 'rtl');
        if (isFrench()) text.verse_id = ` ${text.verse_start}`;
        paragraph.innerHTML += `<span id='${text.verse_id}'' class='clickMe'>${text.verse_id} ${text.verse_text}</span>`;
    });
}

const displayBooks = (booksList) => {
    const dropdown = document.querySelector('.dropdown-content');

    dropdown.innerHTML = '';
    booksList.forEach((book) => {
        const string = String(book.book_id);
        dropdown.innerHTML += `<a class='bookName ${book.dam_id}' id='${book.book_id}' onclick=updateCurrentBook(\'${string}\')>${book.book_name}</a>`
    });
}

const displayChapters = (currentBookData) => {
    const dropdown = document.querySelector('.dropdown-contentCH');

    dropdown.innerHTML = '';
    const chapterList = currentBookData.chapters.split(',');

    chapterList.forEach((chapter) => {
        dropdown.innerHTML += `<a class='chapterID' onclick=updateCurrentChapter('${chapter}')>${chapter}</a>`
    });
}

const setCurrentBook = (bookId) => {
    const currentBook = document.querySelector('#book');

    state.currentBookId = bookId;
    state.currentBook = state.books[`${bookId}`].book_name;
    currentBook.textContent = state.currentBook;
}

const setCurrentChapter = chapter => {
    const currentChapter = document.querySelector('#chapter');

    state.currentChapter = chapter;
    currentChapter.textContent = state.currentChapter;
}

const setAudioSrc = (audio, audioData) => {
    audio.currentTime = 0;
    audio.src = `https://fcbhabdm.s3.amazonaws.com/mp3audiobibles2/${audioData.path}`;
}

const fetchBooks = async (key, version) => {
    const url = getBooksEndpoint(key, version);
    const books = await fetchData(url);
    books.forEach(book => {
        state.books[`${book.book_id}`] = book;
    });
    return books;
}

const fetchText = async (damId, chapter = 1) => {
    if (isFrench()) {
        const url = getFrenchTextEndpoint(state.version, chapter)
        const text = await fetchData(url);
        return text.data;
    }
    const url = getTextEndpoint(damId, chapter, state.version)
    const text = await fetchData(url);
    return text;
}

const fetchAudio = async (damId, chapter = 1) => {
    const url = getAudioEndpoint(damId, chapter)
    const audioData = await fetchData(url);
    return audioData[0];
}

const fetchVerseTimestamps = async (damId, chapter = 1) => {
    if (!isEnglish()) return;
    const url = getVerseTimestampsEndpoint(damId, chapter);
    const timestamps = await fetchData(url);
    return timestamps;
}

const getBooksEndpoint = (key, version) => {
    return `https://dbt.io/library/book?key=${key}&dam_id=${version}&v=2`
}

const getTextEndpoint = (damId, chapter, version) => {
    return `https://dbt.io/text/verse?key=${state.key}&dam_id=${damId}2ET&book_id=${state.currentBookId}&chapter_id=${chapter}&v=2`;
}

const getFrenchTextEndpoint = (version, chapter) => {
    return `https://api.v4.dbt.io/bibles/filesets/${version}/${state.currentBookId}/${chapter}?key=52e62d4c-f7c8-4a8b-9008-8634d0fbddb0&v=4`;
}

const getAudioEndpoint = (damId, chapter) => {
    return `https://dbt.io/audio/path?key=${state.key}&dam_id=${damId}2DA&book_id=${state.currentBookId}&chapter_id=${chapter}&v=2`;
}

const getVerseTimestampsEndpoint = (damId, chapter) => {
    return `https://dbt.io/audio/versestart?key=${state.key}&dam_id=${damId}2DA&osis_code=${state.currentBook}&chapter_number=${chapter}&v=2`;
}

const fetchData = async (url) => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }
    catch (err) {
        console.log('Could not fetch data');
        console.log(err);
    }
}

const updateCurrentBook = (bookId = 'Luke') => {
    setCurrentBook(bookId);
    updateCurrentChapter();
}

const updateCurrentChapter = (chapter = 1) => {
    const { currentBookId } = state;
    const bookData = state.books[`${currentBookId}`];

    setCurrentChapter(chapter);
    displayChapters(bookData);
    updateAudioSrc(chapter);
    updateText(chapter);
}

const updateText = async (chapter = 1) => {
    const { currentBookId } = state;
    const damId = state.books[`${currentBookId}`].dam_id;
    const text = await fetchText(damId, chapter);
    
    displayText(text);
}

const updateAudioSrc = async (chapter = 1) => {
    const { currentBookId } = state;
    const damId = state.books[`${currentBookId}`].dam_id;
    const audioData = await fetchAudio(damId, chapter);
    const audio = document.querySelector('#listener');

    setAudioSrc(audio, audioData);
}

const handleChapterChange = () => {
    prevChapter();
    nextChapter();
}

const handleAudioPlayerChange = (audio) => {
    audioPlaybackDisplay(audio);
    playButton(audio);
    progressBar(audio);
    skipButtons(audio);
    volumeControl(audio);
    playbackSpeed(audio);
}

const handleTextClick = () => {
    const section = document.querySelector('section');
    const whatsapp = document.querySelector('#side_button');

    whatsappHighlight(section);
    shareButton(section, whatsapp);
}

const handleTextHighlighting = () => {
    const audio = document.querySelector('#listener');

    audio.addEventListener('timeupdate', () => highlightText(audio));
}

const prevChapter = () => {
    const prev = document.querySelector('#reverseBtn');

    prev.addEventListener('click', () => {
        if (isFirstChapter(state.currentBook, Number(state.currentChapter) - 1)) return;
        updateCurrentChapter(Number(state.currentChapter) - 1);
    });

    function isFirstChapter(currentBook, chapter) {
        const chapters = state.books[`${currentBook}`].chapters;
        const [ firstChapter ] = chapters.split(',')[0];

        if (chapter < Number(firstChapter)) return true;
        return false;
    }
}

const nextChapter = () => {
    const next = document.querySelector('#forwardBtn');

    next.addEventListener('click', () => {
        if (isLastChapter(state.currentBook, Number(state.currentChapter) + 1)) return;
        updateCurrentChapter(Number(state.currentChapter) + 1);
    });

    function isLastChapter(currentBook, chapter) {
        const chapters = state.books[`${currentBook}`].chapters;
        const [ lastChapter ] = chapters.split(',').slice(-1);

        if (chapter > Number(lastChapter)) return true;
        return false;
    }
}

const audioPlaybackDisplay = audio => {
    audio.addEventListener('canplay', () => {
        handleProgress();
        displayCurrentTime();
        displayAudioDuration();
    });
    audio.addEventListener('timeupdate', () => {
        handleProgress();
        displayCurrentTime();
    });

    function handleProgress() {
        const progressBar = document.querySelector('.progressFiller');
        const percentComplete = (audio.currentTime / audio.duration) * 100;
        progressBar.style.flexBasis = `${percentComplete}%`;
    }

    function displayCurrentTime() {
        const currentTime = document.querySelector('#currentTime');
        const minutes = getMinutes(audio.currentTime);
        const seconds = getSeconds(audio.currentTime);

        currentTime.innerHTML = `${minutes}:${(seconds < 10) ? `0${seconds}` : seconds}`;
    }

    function displayAudioDuration() {
        const duration = document.querySelector('#duration');
        const minutes = getMinutes(audio.duration);
        const seconds = getSeconds(audio.duration);

        if (minutes !== 0 || seconds !== 0) duration.innerHTML = '';
        duration.innerHTML = `${minutes}:${(seconds < 10) ? `0${seconds}` : seconds}`;
    }

    function getMinutes(time) {
        return Math.floor(parseInt(time) / 60);
    }

    function getSeconds(time) {
        return parseInt(time) % 60;
    }
}

const playButton = audio => {
    const toggle = document.querySelector('#toggle');

    toggle.addEventListener('click', togglePlay);

    function togglePlay() {
        const method = audio.paused ? 'play' : 'pause';
        audio[method]();
        updateButton();
    }

    function updateButton() {
        const icon = audio.paused ? '►' : '❚❚';
        toggle.textContent = icon;
    }
}

const progressBar = audio => {
    const progress = document.querySelector('.progress');

    let mousedown = false;
    progress.addEventListener('click', scrub);
    progress.addEventListener('mousemove', (e) => mousedown && scrub(e));
    progress.addEventListener('mousedown', () => mousedown = true);
    progress.addEventListener('mouseup', () => mousedown = false);

    function scrub(e) {
        const scrubTime = (e.offsetX / progress.offsetWidth) * audio.duration;
        audio.currentTime = scrubTime;
    }
}

const skipButtons = audio => {
    const skipButtons = document.querySelectorAll('[data-skip]');

    skipButtons.forEach(button => button.addEventListener('click', skip));

    function skip() {
        audio.currentTime += parseFloat(this.dataset.skip);
    }
}

const volumeControl = audio => {
    const volume = document.querySelector('.slider');

    volume.addEventListener('change', handleVolumeChange);
    volume.addEventListener('mousemove', handleVolumeChange);

    function handleVolumeChange() {
        audio[this.name] = this.value;
    }
}

const playbackSpeed = audio => {
    const speed = document.querySelector('.playSpeed');

    speed.addEventListener('click', changeSpeed);

    function changeSpeed() {
        if (speed.textContent == '1x') {
            speed.textContent = '1.5x';
            audio.playbackRate = 1.5;
        } else if (speed.textContent == '1.5x') {
            speed.textContent = '.75x';
            audio.playbackRate = 0.75;
        } else {
            speed.textContent = '1x';
            audio.playbackRate = 1;
        }
    }
}

const whatsappHighlight = section => {
    section.addEventListener('click', event => {
        if (event.target.classList.contains('clickMe')) {
            clickToHighlight(event);
        }
    });

    function clickToHighlight(event) {
        if (isAudioPlaying()) return;
        toggleWhatsappHighlight(event);
    }

    function isAudioPlaying() {
        return toggle.textContent == '❚❚';
    }

    function toggleWhatsappHighlight(event) {
        if (isVerseHighlighted(event)) {
            removeWhatsappHighlight(event);
        } else {
            addWhatsappHighlight(event);
        }
    }

    function isVerseHighlighted(event){
        return event.target.classList.contains('highlight2');
    }

    function removeWhatsappHighlight(event) {
        event.target.className = event.target.className.replace(' highlight2', '');
        event.target.style.background = '#ffffff';
        event.target.style.color = 'black';
    }

    function addWhatsappHighlight(event) {
        event.target.className += ' highlight2';
        event.target.style.background = '#1e9544';
        event.target.style.color = 'white';
    }
}

const shareButton = (section, whatsapp) => {
    section.addEventListener('click', event => {
        if (event.target.classList.contains('clickMe')) {
            display(whatsapp);
        }
    });

    function display(whatsapp) {
        const verseSelection = selectHighlightedVerses();
        if (verseSelection == 'https://wa.me/?text=') {
            showShareButton(whatsapp);
        } else {
            removeShareButton(whatsapp, verseSelection);
        }
    }

    function selectHighlightedVerses() {
        let verseSelection = 'https://wa.me/?text=';
        paragraph.querySelectorAll('.highlight2').forEach(verse => {
            verseSelection += verse.innerText
        });
        verseSelection = verseSelection.split(' ').join('%20');
        return verseSelection;
    }

    function showShareButton(whatsapp) {
        whatsapp.removeAttribute('href');
        whatsapp.removeAttribute('xlink:href');
        whatsapp.classList.add('show');
    }

    function removeShareButton(whatsapp, verseSelection) {
        whatsapp.setAttribute('href', verseSelection);
        whatsapp.setAttribute('xlink:href', verseSelection);
        whatsapp.classList.remove('show');
    }
}

const highlightText = (audio) => {
    if (!isEnglish()) return;
    const { timestamps } = state;
    const lastVerse = timestamps.length;

    timestamps.forEach((timestamp, index, array) => {
        const currentVerse = timestamp.verse_id;

        if (isCorrectTimeframe(audio, {timestamp, index, array})) {
            highlightVerse(currentVerse, array);
        } else if (areTimestampsIncorrect(audio, array)) {
            highlightVerse(lastVerse, array);
            unhighlightVerse(lastVerse - 1, array);
        } else {
            unhighlightVerse(currentVerse, array);
        }
    });

    function isCorrectTimeframe(audio, {timestamp, index, array}) {
        const isGreaterThanCurrentVerse = audio.currentTime >= timestamp.verse_start;
        const isLessThanNextVerse = audio.currentTime < array[index + 1].verse_start;
        const isLessThanDuration = audio.currentTime < audio.duration - 1;
        
        return isGreaterThanCurrentVerse && isLessThanNextVerse && isLessThanDuration;
    }

    function areTimestampsIncorrect(audio, timestamps) {
        const areTimestampsTooShort = audio.currentTime >= timestamps[timestamps.length - 1].verse_start;
        const isThereStillAudioToPlay = audio.currentTime <= audio.duration - 1;

        return areTimestampsTooShort && isThereStillAudioToPlay;
    }

    function highlightVerse(index, timestamps) {
        document.getElementById(timestamps[index - 1].verse_id).style.background = "#f9e93d";
        document.getElementById(timestamps[index - 1].verse_id).style.color = 'black';
    }

    function unhighlightVerse(index, timestamps) {
        document.getElementById(timestamps[index - 1].verse_id).style.background = "#ffffff";
        document.getElementById(timestamps[index - 1].verse_id).style.color = 'black';
    }
}

const isEnglish = () => {
    return state.version == 'ENGESV';
}

const isArabic = () => {
    return state.version == 'ARBAS1';
}

const isFrench = () => {
    return state.version == 'FRNPDV';
}
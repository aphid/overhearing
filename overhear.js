var interrogator;
var hearing = 'intel20130312';

var canvas = document.getElementById('graph');
var ctx = canvas.getContext('2d');
var startTime;
var transmitQueue = [];
//   var tempTime = 1380;
var tempTime = 1370;
var tempdur;
var totalSilences;
var mode = "rough"; //fine/ultrafine
var attention = "focus";
var duration;
ctx.fillStyle = "rgb(6, 6, 80)";
ctx.translate(0, canvas.height);
ctx.scale(1, -1);


//var socket;

var postxt = document.querySelector('#pos');
var engtxt = document.querySelector('#engtxt');
var roltxt = document.querySelector('#roltxt');
var gapstxt = document.querySelector('#gaps');
var totalsil = document.querySelector('#totalSil');
var modetxt = document.querySelector('#mode');
var lastgap = document.querySelector('#lastgap');
var msg = document.querySelector('#message');
var inttxt = document.querySelector('#interval');
var threshtxt = document.querySelector('#threshold');



function mapSilence(start, end) {
    var bar = document.createElement('div');
    bar.classList.add('bar');
    var dur = end - start;
    var pct = (dur / duration) * 100;
    console.log('silence is ' + pct);
    console.log("s " + start + " dur " + duration);
    var left = start / duration;
    bar.style.left = left * 100 + "%";
    bar.style.width = pct + "%";
    document.querySelector('#mapping').appendChild(bar);
}


function drawBar(i, h) {
    ctx.fillRect((i), 0, 1, h);
}


window.onblur = function() {
    attention = "blur";
};
window.onfocus = function() {
    attention = "focus";
};
var localGaps, interval, rmsThreshold, gapThreshold, audioCtx, source, engs, rollofs, mopts, meyda, last, aud, lasttrackid, stream;


var renderEngs = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < engs.length; i++) {
        if (engs[i] > document.querySelector('#highest').textContent) {
            document.querySelector('#highest').textContent = engs[i];
        }
        if (engs[i] < rmsThreshold) {
            ctx.fillStyle = "rgba(255, 255, 0, 0.4)";
        } else {
            ctx.fillStyle = "rgba(255, 128, 0, 0.4)";
        }
        drawBar(i, engs[i] * 800);
    }
};

var aud = Popcorn('video');

var seekFwd = async function() {

    await playing(tempTime);
    tempTime = tempTime + interval;
    requestAnimationFrame(frametest);
};
var stop = false;
var gaps = [];
var tempGap = {};

async function playing(time) {
    return new Promise(function(resolve, reject) {
        aud.media.addEventListener('playing', function(e) {
            resolve(); // done
        }, {
            once: true
        });
        aud.play(time);

    });

}

function exactStart(time) {
    engs = [];
    mode = "findStart";
    msg.textContent = "Seeking first vocalization: fine";
    if (time) {
        tempTime = (time - interval) - 8;
    }
    interval = 0.001;
    rmsThreshold = 0.03;
}



async function createReverb(ctx) {
    let convolver = ctx.createConvolver();

    // load impulse response from file
    let response = await fetch("lodge.wav");
    let arraybuffer = await response.arrayBuffer();
    convolver.buffer = await ctx.decodeAudioData(arraybuffer);

    return convolver;
}



async function setupEvents() {
    localGaps = 0;
    interval = 8; //seconds
    rmsThreshold = 0.05; //in whatever RMS are measured in
    gapThreshold = 0.15; //seconds
    audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    source = audioCtx.createMediaElementSource(document.querySelector('video'));
    engs = [];
    rollofs = [];
    let reverb = await createReverb(audioCtx);


    //var gainNode = audioCtx.createGain();
    //source.connect(gainNode);
    source.connect(reverb);
    reverb.connect(audioCtx.destination);


    //var meyda = new Meyda(audioCtx, source, 512);
    mopts = {
        "audioContext": audioCtx, // required
        "source": source, // required
        "buffer": 2048,
        "windowingFunction": "rect", // optional
        "featureExtractors": ["rms"], // optional - A string, or an array of strings containing the names of features you wish to extract.
        //"callback": Function // optional callback in which to receive the features for each buffer
    }
    meyda = Meyda.createMeydaAnalyzer(mopts);
    console.log(meyda);
    meyda.start();
    stream = aud.media.src.split('/').pop().replace('.ogg', '');
    last = 0;
    lasttrackid;
    /* socket.on('toDate', function (things) {
        //console.log(things);
        //    JSON.parse(things);
        things = JSON.parse(things.data);
        console.log(things.length);

        for (thing of things) {
            if (thing.attention === "focus") {
                console.log("MAPPING THING");
                console.log(thing);
                mapSilence(thing.start, thing.end)
            }
        }

    });

    socket.on('silence', function (things) {
        console.log('chachachachanges');
        console.log(things);
        if (things.attention === "focus") {
            mapSilence(things.start, things.end)
        }
    });
    
*/
}


aud.media.addEventListener('loadedmetadata', function() {
    duration = aud.duration();
    //socket = io.connect("http://localhost:3000");
    //tempTime = Math.random() * aud.duration();
    this.pause(1370);
    //console.log(result);
    //interrogator = result;
    /* 
    socket.emit('authenticate', {
        'interrogator': result,
        'hearing': hearing
    });
    socket.emit('subscribe', {
        name: 'silence',
        hearing: hearing
    });
    */
    console.log("metadata loaded");
    document.querySelector("#content").style.display = "block";

    aud.off('loadedmetadata');
    msg.textContent = "Seeking first vocalization: rough";
    document.querySelector("video").setAttribute("controls", true);

}, {
    once: true
});


aud.media.addEventListener("loadeddata", function() {
    console.log("canplay");
    setupEvents();

}, {
    once: true
});

aud.on("play", function() {
    console.log("here we go...");
    aud.pause(1370);
    aud.off("play");

    seekFwd();
});

aud.on('seeked', function() {
    var curse = document.querySelector("#curse");
    curse.style.left = (aud.currentTime() / duration) * 100 + "%";
});



async function sleep(ms) {
    return new Promise(function(resolve, reject) {
        setTimeout(() => {
            resolve(0)
        }, ms);
    });
}

async function frametest() {
    modetxt.textContent = mode;
    if (stop === true) {
        aud.pause();

        return false;
    }

    var eng = meyda.get('rms');
    //var rolloff = meyda.get('spectralRolloff');
    if (engtxt.textContent != eng) {
        aud.pause();
        engtxt.textContent = eng;
        //roltxt.textContent = rolloff;
        inttxt.textContent = (interval * 1000) + "ms";
        threshtxt.textContent = rmsThreshold + "/" + (gapThreshold * 1000) + "ms";
        engs.push(eng);
        if (engs.length > 800) {
            engs.shift();
        }
        renderEngs();
        postxt.textContent = aud.currentTime() + "s";
        if (eng < rmsThreshold) {
            engtxt.classList.add('low');
            gap(aud.currentTime());

            //store this data
        } else {
            if (mode === "rough") {
                console.log("wat.");
                console.log(aud.currentTime());
                exactStart(aud.currentTime());
                console.log(interval);
            } else if (mode === "findStart") {
                console.log(eng + " " + aud.currentTime());
                startTime = aud.currentTime();
                engs = [];
                rolloffs = [];
                msg.textContent = "Finding silences";
                mode = "medium";
                tempGap = {};
                rmsThreshold = 0.02;
                interval = 0.003;
            } else if (mode === "medium") {
                await notGap(aud.currentTime());

            }
            engtxt.classList.remove('low');
        }
        requestAnimationFrame(seekFwd);
        /*var to = window.setTimeout(function () {
          seekFwd();
        }, 70);*/
    } else {
        requestAnimationFrame(frametest);

    }
}



var gap = function(time) {
    if (!tempGap.start) {
        tempGap.start = time;
    }
};

var transmitGap = async function(gap) {
    /* socket.emit('intel', {
        'type': 'silence',
        'hearing': hearing,
        'start': gap.start,
        'end': gap.end,
        'attention': attention
    }); 
    */
};



var notGap = async function(time) {
    if (tempGap.start) {
        tempGap.end = time;
        var difference = tempGap.end - tempGap.start;
        if (difference >= gapThreshold) {
            await transmitGap(tempGap);
            await playOnce(tempGap);
            localGaps++;
            gapstxt.textContent = localGaps;
            totalsil.textContent = totalSilences;
            lastgap.textContent = difference;
        }
        tempGap = {};
    }
};


async function playOnce(thegap) {
    console.log("playing gap", thegap);
    await sleep(1500);
    return new Promise(async function(resolve) {
        let start = thegap.start;
        let end = thegap.end;
        aud.media.currentTime = start;
        aud.media.addEventListener("timeupdate", async function tim(e) {
            if (aud.media.currentTime > end) {
                //aud.currentTime = start;
                aud.pause();
                aud.media.removeEventListener("timeupdate", tim);
                await sleep(1500);

                resolve();
            }
        });
        aud.play();

    })
};


async function moveVid(time) {
    return new Promise(function(resolve) {
        aud.addEventListener("timeupdate", function() {
            return (resolve);
        }, {
            once: true
        });

        aud.currentTime = time;
    });

}

aud.on("ended", function() {
    stop = true;
    //gaps = shuffleArray(gaps);
    //playSilence();
});

var lastgap = 0;


var playSilence = function(index) {
    if (!index) {
        index = 0;
    }
    msg.textContent = "Playing " + index + "/" + gaps.length;
    var agap = gaps[index || 0];
    console.log(agap);
    aud.removeTrackEvent(lasttrackid);
    aud.code({
        gap: agap,
        start: agap.start,
        end: agap.end,
        onEnd: function() {
            aud.pause();
            if (lastgap < gaps.length) {
                lastgap++;
                var to = window.setTimeout(function() {
                    playSilence(lastgap);
                }, 500);
            }
        }
    });
    lasttrackid = aud.getLastTrackEventId();
    console.log(lasttrackid);
    aud.play(agap.start);
};
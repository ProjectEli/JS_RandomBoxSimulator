// 뽑기 확률 계산기(random box simulator)
// Author: ProjectEli (https://projecteli.tistory.com/)
// Date: 2022-01-17
// ProjectEli 2022, All rights reserved.

var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
});

$("#btn-prop-calc").click(function(event){
  $('input').prop('disabled',true);
  $("#btn-prop-calc").prop('disabled',true);
  $("#prop-calc-result").addClass('hidden');
  $('#loader').removeClass('hidden');
  
  setTimeout(MainWork,500);
  }
);

function MainWork() {
  var startTime = performance.now();
  let resulttag = $("#prop-calc-result");
  let probvalue = parseFloat($("#probvalue").val()) /100; // double number
  let costper = parseFloat($("#costper").val()) ; // double number
  let costperUnit = $("#costperunit option:checked").text() ;
  let trials = parseInt($("#numtrials").val());
  let numwant = parseInt($("#numwant").val());

  let isValidInputPack = IsValidInput(probvalue,trials,numwant);
  let isValidInput = isValidInputPack[0];
  let errMsg = isValidInputPack[1];

  if (isValidInput) {
    let problist = calc_probs_full(probvalue,trials);

    // main calculation
    let successtable = buildSuccessTable(problist,trials,numwant);
    let firstFewWinnings = buildFirstFewWinningsTable(problist,trials,numwant);

    let targetProbPercentList = [10,20,30,40,50,60,70,80,90,95,99];
    let requiredTrials = buildRequiredTrialsTable(probvalue,numwant,costper,costperUnit,targetProbPercentList);

    // display success or not prob
    resulttag.html("<h2>"+trials.toString()+"회 시도시 목표 달성률</h2>");
    resulttag.append(successtable);

    // display first few winnings
    resulttag.append("<h2>N회 이상 당첨 확률(10회까지)</h2>");
    resulttag.append(firstFewWinnings);

    // display required trials
    resulttag.append("<h2>"+numwant.toString()+"회 이상 당첨될 때까지 예상 뽑기 횟수</h2>");
    resulttag.append(requiredTrials);
  }
  else {
    $("#prop-calc-result").html(errMsg);
  }
  $('#loader').addClass('hidden');
  $("#prop-calc-result").removeClass('hidden');
  $('input').prop('disabled',false);
  $("#btn-prop-calc").prop('disabled',false);
  
  var endTime = performance.now();
  $('#elapsedtime').text( (endTime-startTime).toString() +"ms" );
}

function IsValidInput(probvalue,trials,numwant) {
  if (trials < numwant) {
    return [false, "계산 실패: 뽑기 횟수보다 당첨 횟수 목표가 더 많습니다!"]
  }
  else if (probvalue>=1) {
    return [false, "계산 실패: 1뽑 확률이 100% 이상입니다!"]
  }
  else if (trials>10000) {
    return [false, "계산 실패: 뽑기 시도 횟수가 10000회보다 큽니다!(최대 10000회)"]
  }
  else {
    return [true, ""];
  }
}

function probTableTemplate() {
  var outer = document.createElement('div'); // false shell
  let innerHTML = `<table class="table table-striped table-hover">
            <thead>
                <tr>`
  for (let k =0; k<arguments.length; k++) {
    innerHTML += ("<th>"+arguments[k]+ "</th>"); // col header texts
  }
  innerHTML += `</tr>
            </thead>
            <tbody>
            </tbody>
        </table>`;
  outer.innerHTML = innerHTML;
  return outer.firstChild;
}

function setRowContent() { // input: row, numtext, probspercent1, probspercent2, ...
  let row= arguments[0];
  let numtext = arguments[1];
  
  // first row
  let tdtrials = document.createElement("td");
  tdtrials.innerHTML = numtext; // ex: "1회 이상"
  row.appendChild(tdtrials);
  
  // rest rows. arguments[k] = probspercent
  for (let k =2; k<arguments.length; k++) {
    let td = document.createElement("td");
    let propnum = document.createElement("span");
    propnum.className= "propnum";
    propnum.innerHTML = arguments[k].toPrecision(5)+"%";
    let progressbar = document.createElement("div");
    progressbar.className = "progress-bar progress-bar-striped progress-bar-animated bg-warning";
    if (k==arguments.length-1) {
      progressbar.className = "progress-bar progress-bar-striped progress-bar-animated";
    }
    progressbar.setAttribute("role", "progressbar");
    progressbar.setAttribute("aria-valuenow",arguments[k]);
    progressbar.style.width = arguments[k].toString()+"%";
    progressbar.setAttribute("aria-valuemin",0);
    progressbar.setAttribute("aria-valuemax",100);
    let progress = document.createElement("div");
    progress.className = "progress";
    progress.appendChild(progressbar);
    td.appendChild(propnum);
    td.appendChild(progress);
    row.appendChild(td);
  }
}

function setRowContentRequiredTrials() { // input: row, text1, text2, ...
  let row= arguments[0];
  for (let k =1; k<arguments.length; k++) {   // arguments[k] = text
    let td = document.createElement("td");
    td.innerHTML = arguments[k];
    row.appendChild(td);
  }
}

function nck(n,k) {
  let r = Math.min(k, n-k);
  let numer = 1; 
  let denom =1;
  for (let k2=n; k2>(n-r); k2--) { numer = numer*k2; }
  for (let k2=1; k2<(r+1); k2++) { denom = denom*k2; }
  return (numer/denom);
}

function binomial(n, k) {
     if ((typeof n !== 'number') || (typeof k !== 'number')) 
  return false; 
    var coeff = 1;
    k = Math.min(k,n-k);
    for (let k2=1; k2<=k;k2++) {
      coeff = coeff*(n-k2+1)/k2;
    }
  return coeff
}


function calc_probs_full(probvalue, trials) {
  // let probvalue = parseFloat($("#probvalue").val()) /100; // double number
  // let trials = parseFloat($("#numtrials").val()); // double number
  let problist = [];  
  let reciproc_probvalue = 1-probvalue;
  for (let k =0; k <= trials; k++) {
    //problist[k] = nck(trials,k)*(probvalue**k)*(reciproc_probvalue**(trials-k));
    //problist[k] = math.combinations(trials,k)*(probvalue**k)*(reciproc_probvalue**(trials-k));
    problist[k] = binomial(trials,k)*(probvalue**k)*(reciproc_probvalue**(trials-k));
  }
  return problist;
}

function prob_notsuccess(problist,numwant) {
  return cumulative_specific(problist,numwant-1);
}

function cumulative_specific(problist,index) {
  var sum = 0;
  for (let k=0; k<=index; k++) {
    sum += problist[k];
  }
  return sum;
}

function buildSuccessTable(problist,trials,numwant) { //assume numwant>=1
  let prob_failed = prob_notsuccess(problist,numwant);
  let prob_succeed = 1-prob_failed;
  
  let tb = probTableTemplate("당첨 횟수","달성 확률");
  var tr = tb.insertRow(); tr.className = "table-success";
  if (numwant==trials) {
    setRowContent(tr, (numwant).toString()+"회",prob_succeed*100);
  }
  else {
    setRowContent(tr, (numwant).toString()+"회 이상",prob_succeed*100);
  }
  var tr = tb.insertRow(); tr.className = "table-danger";
  if (numwant==1) {
    setRowContent(tr, "0회",prob_failed*100);
  }
  else {
    setRowContent(tr, (numwant-1).toString()+"회 이하",prob_failed*100);
  }  
  return tb;
}

function buildFirstFewWinningsTable(problist,trials,numwant) {
  let criterionNumber = 10;
  let Nrows = Math.min(trials,criterionNumber);
  let tb = probTableTemplate("당첨 횟수","기대 확률","해당횟수 이상 당첨률");
  let cumulativeProbPercent = 0;
  for (let k=0; k<=Nrows; k++) {
    var tr = tb.insertRow(); 
    if (numwant==k) {
      tr.className = "table-success";
    }
    let probPercent = problist[k]*100;
    setRowContent(tr, k.toString()+"회",probPercent,100-cumulativeProbPercent);    
    cumulativeProbPercent += probPercent;
  }
  return tb;
}

// ref: https://stackoverflow.com/a/45869209
function binocdf_upper(x,n,p) {
  // console.log(x.toString()+" "+n.toString()+" "+p.toString())
  let cdf=0;
  let b=0;
  for (let k=0; k<=x; k++) {
    if (k>0) {
      b = b+ Math.log(n-k+1) - Math.log(k);
    }
    cdf = cdf+ Math.exp(b+k*Math.log(p) + (n-k)*Math.log(1-p));
  }
  return 1-cdf;
}

function binocdf_upper_array(x,narr,p) {
  let parr = [];
  narr.forEach( n => {
    parr.push(binocdf_upper(x,n,p));
  })
  return parr;
}

// ref: https://stackoverflow.com/questions/59264119/how-do-i-interpolate-the-value-in-certain-data-point-by-array-of-known-points
function interp1_ceil(xarr, yarr, xpoints) { // linear interpolation
  let ypoints = [];
  xpoints.forEach( xpoint => {
    let	xa = [...xarr].reverse().find(x => x<=xpoint);
    let xb = xarr.find(x => x>= xpoint);
    let ya = yarr[xarr.indexOf(xa)];
    let yb =yarr[xarr.indexOf(xb)];
    ypoints.push( Math.ceil (yarr[xarr.indexOf(xpoint)] || ya+(xpoint-xa)*(yb-ya)/(xb-xa) ) );
  })
	return ypoints
}

function FindFirst(arr,criterion) { // return first matching index
  for (let k=0; k<arr.length; k++) {
    if (arr[k] >= criterion) {
      return k;
    }
  }
  return 0; // should not be executed
}

function buildRequiredTrialsTable(probvalue,numwant,costper,costperUnit,targetProbPercentList) {
  let NvP = targetProbPercentList.length;
  let vP = [];
  for (let k=0; k<NvP; k++) {
    vP.push(targetProbPercentList[k]/100);
  }
  
  let testn = [1,10,1e2,1e3,1e4,1e5,1e6];
  let testp = binocdf_upper_array(numwant-1,testn,probvalue);
  
  let thd = 1e-6; // critical threshold
  let testPDelta = []; // differential array. length is length-1
  let validni = [];
  for (let k=0; k<NvP-1;k++) {
    testPDelta.push(testp[k+1]-testp[k]-thd);
    if (testPDelta[k]>0) {
      validni.push(k);
    }
  }
  let minvalidni = validni[0];
  if (minvalidni>0) {
    minvalidni -= 1;
  }
  
  let maxvalidni = validni[validni.length-1];
  if (maxvalidni<NvP-1) {
    maxvalidni += 1;
  }
  
  let minvalidn = testn[minvalidni];
  let maxvalidn = testn[maxvalidni];
  let validInterval = Math.ceil( (maxvalidn-minvalidn)/1000 ); // test 1001 points
  
  let roughn = [];
  for (let k=minvalidn; k<=maxvalidn; k=k+validInterval) {
    roughn.push(k);
  }
  let roughP = binocdf_upper_array(numwant-1,roughn,probvalue);
  let Nrough = roughn.length;
  
  let reqn = [];
  if (validInterval>1) {
    let approxn = interp1_ceil(roughP,roughn,vP); // linear interpolation then ceil
    let approxP = binocdf_upper_array(numwant-1,approxn,probvalue);
    for (let k=0; k<NvP; k++) {
      reqn.push( approxn[FindFirst(approxP,vP[k])]);
    }
  }
  else {
    let exactn = roughn;
    let exactP = roughP;
    for (let k=0; k<NvP; k++) {
      reqn.push( exactn[ FindFirst(exactP, vP[k])]);
    }
  }
  let requiredTrials = reqn;
   
  //build table
  let tb = probTableTemplate("가능성","요구 뽑기 수","예상 비용");
  
  for (let k=0; k<requiredTrials.length; k++) {
    var tr = tb.insertRow();
    let targetProb = targetProbPercentList[k];
    if (targetProb == 50) {
      tr.className = "table-info";
    }
    else if (targetProb == 80) {
      tr.className = "table-success";
    }
    else if (targetProb == 90) {
      tr.className = "table-warning";
    }
    else if (targetProb == 95) {
      tr.className = "table-primary";
    }
    else if (targetProb == 99) {
      tr.className = "table-danger";
    }
    let requiredTrial = requiredTrials[k];
    let expectedCost = requiredTrial*costper;
    setRowContentRequiredTrials(tr, targetProb+"%",requiredTrial+"회",
                                expectedCost.toString()+costperUnit);
  }
  return tb;
}

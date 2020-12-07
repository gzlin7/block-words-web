var experimentApp = angular.module('experimentApp', ['ngSanitize', 'ngCsv']);
var start_time;

// function shuffle(array) {
//     for (var i = array.length - 1; i > 0; i--) {
//         var j = Math.floor(Math.random() * (i + 1));
//         var temp = array[i];
//         array[i] = array[j];
//         array[j] = temp;
//     }
//     return array
// }

experimentApp.directive('imageonload', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element.bind('load', function () {
        scope.$apply(function () {
          scope.loaded = true;
        });
      });
      // element.bind('error', function () {
      //   console.log('image could not be loaded');
      // });
    }
  };
});

experimentApp.controller('ExperimentController',
  function ExperimentController($scope) {
    $scope.section = "instructions";
    $scope.inst_id = 0;
    $scope.stim_id = 0;
    $scope.part_id = -1;
    $scope.tutorial_step = 1;
    $scope.tutorial_length = 7;
    $scope.tutorial_text = ``;
    $scope.response = {"relprob": [50, 50, 50, 50, 50]};
    $scope.csv_header = [
      "timestep",
      "goal_probs_0",
      "goal_probs_1",
      "goal_probs_2",
      "goal_probs_3",
      "goal_probs_4",
      "true_goal_probs"
    ];
    // $scope.csv_name = function() {
    //   return $scope.stimuli[$scope.stim_id-1].name + "_" + Date.now() + ".csv"
    // }
    $scope.ratings = [];
    $scope.reload_gif = function() {
      if ($scope.section == "stimuli") {
        var id = document.getElementById("stimulus-img");
      } else {
        var id = document.getElementById("instruction-img")
      }
      id.src = id.src;
    }
    $scope.advance = function() {
      $scope.loaded = false;
      if ($scope.section == "instructions") {
        $scope.advance_instructions()
      } else if ($scope.section == "stimuli") {
        $scope.advance_stimuli()
      } else if ($scope.section == "endscreen") {
        // Do nothing
      }
    };
    $scope.advance_instructions = function() {
      if ($scope.inst_id == $scope.instructions.length - 1) {
        storeToDB($scope.user_id + "_tutorial", $scope.ratings);
        $scope.response = {"relprob": [50, 50, 50, 50 , 50]};
        $scope.reward_score = 0;
        $scope.section = "stimuli";
        $scope.stim_id = 0;
        $scope.part_id = 0;
        $scope.possible_goals = $scope.stimuli_set[$scope.stim_id].goal_space;
        $scope.true_goal = $scope.stimuli_set[$scope.stim_id].goal;
        // get time of first experiment
        if (start_time == undefined) {
          start_time = (new Date()).getTime();
        }
      } else {
        if ($scope.instructions[$scope.inst_id].tutorial) {
          $scope.ratings.push($scope.compute_ratings($scope.response));
          $scope.tutorial_text += `Step ` + $scope.tutorial_step + `: you gave a ` + $scope.points * 10 + 
                                  `% rating to <b>power</b>: ` +  $scope.points + ` points <br>`;
          $scope.tutorial_step = $scope.tutorial_step + 1;
        }
        if ($scope.tutorial_step == $scope.tutorial_length+1) {
            $scope.tutorial_score = ($scope.tutorial_score/$scope.tutorial_length).toFixed(1);
            $scope.tutorial_text += `<br>Averaging all the points, your score for this game is: ` + $scope.tutorial_score + 
                                    ` points`;
            $scope.instructions[$scope.inst_id+1]['text'] += `<br><br> <b>Your bonus payment score breakdown:</b> <br>` + $scope.tutorial_text;
            // console.log($scope.tutorial_text)
            $scope.tutorial_length = 0
        }
        $scope.inst_id = $scope.inst_id + 1;
      }
      // $scope.response = {"relprob": [50, 50, 50, 50 , 50]};
    };
    $scope.advance_stimuli = function() {
      if ($scope.stim_id == $scope.stimuli_set.length) {
        // Advance section
        storeToDB($scope.user_id + "_" + $scope.stimuli_set[$scope.stim_id-1].name, $scope.ratings);
        $scope.reward_score = 0;
        $scope.section = "endscreen" 
      } else if ($scope.part_id < 0) {
        // Store result to DB
        storeToDB($scope.user_id + "_" + $scope.stimuli_set[$scope.stim_id-1].name, $scope.ratings);
        $scope.response = {"relprob": [50, 50, 50, 50 , 50]};
        $scope.reward_score = 0;
        // Advance to first part
        $scope.part_id = $scope.part_id + 1;
        $scope.ratings = [];
        // set possible goals based on stimuli json
        $scope.possible_goals = $scope.stimuli_set[$scope.stim_id].goal_space;
        $scope.true_goal = $scope.stimuli_set[$scope.stim_id].goal;
      } else if ($scope.part_id < $scope.stimuli_set[$scope.stim_id].length) {
        // Advance to next part
        $scope.ratings.push($scope.compute_ratings($scope.response));
        $scope.part_id = $scope.part_id + 1;
        if ($scope.part_id == $scope.stimuli_set[$scope.stim_id].length) {
          // Advance to next problem.
          $scope.part_id = -1;
          $scope.stim_id = $scope.stim_id + 1;
          $scope.bonus_points = (($scope.reward_score * 10)/$scope.stimuli_set[$scope.stim_id-1].length).toFixed(1);
        }
      }
      //$scope.response = {"relprob": [50, 50, 50, 50 , 50]};
    };
    $scope.compute_ratings = function(resp) {
      // Compute normalized probabilities from ratings
      probs = resp.relprob;
      sum_ratings = resp.relprob.reduce((a,b) => a + b, 0);
      probs = probs.map(p => p/sum_ratings);
      // Increase reward score
      $scope.reward_score += probs[$scope.true_goal];
      if ($scope.section == "instructions"){
        $scope.points = (probs[$scope.true_goal]*10).toFixed(1);
        $scope.tutorial_score += probs[$scope.true_goal]*10;
        rating = {
        "timestep": $scope.tutorial_step,
        "time_spent": 0,
        "goal_probs_0": probs[0],
        "goal_probs_1": probs[1],
        "goal_probs_2": probs[2],
        "goal_probs_3": probs[3],
        "goal_probs_4": probs[4],
        "true_goal_probs" : probs[$scope.true_goal],
        "reward_score" : $scope.reward_score 
      }
      }
      else {
      rating = {
        "timestep": $scope.stimuli_set[$scope.stim_id].times[$scope.part_id],
        "time_spent": ((new Date()).getTime()-start_time)/1000.,
        "goal_probs_0": probs[0],
        "goal_probs_1": probs[1],
        "goal_probs_2": probs[2],
        "goal_probs_3": probs[3],
        "goal_probs_4": probs[4],
        "true_goal_probs" : probs[$scope.true_goal],
        "reward_score" : $scope.reward_score 
      }
      start_time = (new Date()).getTime();
      }
      return rating;
    };
    $scope.user_id = Date.now();
    $scope.stimuli_set = [];
    $scope.loaded = false;
    $scope.setStimuli = async function(){
      let count = await getCounter();
      let stim_idx = $scope.stimuli_sets[count % 7];
      for (i = 0; i < stim_idx.length; i++) {
        $scope.stimuli_set.push($scope.stimuli[stim_idx[i]]);
      }
      console.log("stimuli set = " + stim_idx);
      incrementCounter();
      // unhide question sliders- workaround for slider initial flashing
      document.getElementById("question").classList.remove("hidden");    
    };
    $scope.rating_labels = ["Very Unlikely", "Maybe", "Very Likely"];
    $scope.possible_goals = ["power", "cower", "crow", "core", "pore"];
    $scope.true_goal = 0
    $scope.reward_score = 0;
    $scope.bonus_points = 0;
    $scope.tutorial_score = 0;
    $scope.instruction_has_image = function() {
      return $scope.instructions[$scope.inst_id].image != null
    };
    $scope.is_tutorial = function() {
      return $scope.instructions[$scope.inst_id].tutorial == true
    };
    $scope.instructions = [
      {
        text: `Welcome to our word guessing game! <br>
               Press next to continue.`,
      },
      {
        text: `Your friend is moving blocks to spell an English word in a stack (first letter on top). You are watching and trying to guess
               what the word is before your friend finishes spelling.`,
        image: "tutorial/demo/0.png"
      },
      {
        text: `Is the word <b>power</b>, <b>cower</b>, <b>crow</b>, <b>core</b>, or <b>pore</b>?`,
        image: "tutorial/demo/part1.gif"
      },
      {
        text: `The word is <b>core</b>!`,
        image: "tutorial/demo/part2.gif"
      },
      {
        text: `Your task is to watch someone stacking these blocks, and with every block they 
        move, guess which word they are trying to spell.`,
      },
      {
        text: `<b>How to guess?</b> <br>
               You will be given 5 possible words. 
               When a block is moved, you need to rate each word  based on how 
               likely you think it is the word that is being spelled. 
               The rating scale ranges from <i>Very Unlikely</i> to <i>Very Likely</i>`
      },
        {
        text: `<b>Bonus Payment</b> <br>
               As you play this game, you can earn bonus payment based on a score of how close your guess is to the actual word.<br>
               Scoring works as follows:<br>
               1. In every step, you earn points based on how likely you rated the correct word compared to the other words.<br>
               2. Your final score is the average of the points you earned in each step.<br> 
               <br>
               The more correct your guesses are, the more bonus pay you will receive, so please try to make your best guesses!`
      },
      {
        text: `Let's do a practice run, just so you're familiarized.`,
      },
      {
        text: `First, you'll get a chance to look at the available letters and the 5 possible words.
               Before seeing the player move any blocks, rate each possible word based on how likely 
               it is to be the word that the player will try to spell. If you think that all words are 
               equally likely, rate them all as <i>Maybe</i>. `,
        image: "tutorial/tutorial/0.png",
        tutorial: true
      },
      {
        text: `Now watch the player move the first block. What do you think now? <br>

        If you think that two words are equally likely and the rest are not likely, then give the two words the same higher rating, 
        and the rest of the words a lower rating.`,
        image: "tutorial/tutorial/0.gif",
        tutorial: true
      },
      {
        text: `Consider this new move and update your scores if your guesses change. 
        Do you notice that this move doesn't make sense? It is ok, the person 
        spelling the words might make mistakes sometimes. Keep that in mind throughout the games, and just make your best guess here.`,
        image: "tutorial/tutorial/1.gif",
        tutorial: true
      },
      {
        text: `The person spelling the word is fixing the mistake.`,
        image: "tutorial/tutorial/2.gif",
        tutorial: true
      },
      {
        text: `Two more steps...`,
        image: "tutorial/tutorial/3.gif",
        tutorial: true
      },
      {
        text: `One more step...`,
        image: "tutorial/tutorial/4.gif",
        tutorial: true
      },
      {
        text: `Even if it seems obvious what the word is, do make sure 
        to answer correctly by setting all other words as <i>Very Unlikely</i>`,
        image: "tutorial/tutorial/5.gif",
        tutorial: true
      },
      {
        text: `Yes, the word your friend was spelling was <b>power</b>!`,
        image: "tutorial/tutorial/12.png",
      },
      {
        text: `You will guess words for 3 different rounds. Ready to start? Press next to continue!`
      }
    ];
    $scope.stimuli_set_length = 3;
    $scope.stimuli_sets = [
      [0,6,18],
      [3,10,12],
      [2,16,9],
      [19,5,14],
      [4,8,15],
      [7,17,13],
      [11,1,15]
    ]
    $scope.stimuli = [
      {
        "trial": 0,
        "times": [1,2,3,4,5,6],
        "name": "problem_0_1",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 3,
        "problem": 0,
        "length": 6,
        "images": [
          "stimuli/0/1/0.png",
          "stimuli/0/1/0.gif",
          "stimuli/0/1/1.gif",
          "stimuli/0/1/2.gif",
          "stimuli/0/1/3.gif",
          "stimuli/0/1/4.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4],
        "name": "problem_0_2",
        "optimal": true,
        "goal_space": ["wad", "reap", "war", "wade", "draw"],
        "goal": 3,
        "problem": 0,
        "length": 4,
        "images": [
          "stimuli/0/2/0.png",
          "stimuli/0/2/0.gif",
          "stimuli/0/2/1.gif",
          "stimuli/0/2/2.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5],
        "name": "problem_0_3",
        "optimal": true,
        "goal_space": ["wad", "reap", "war", "wade", "draw"],
        "goal": 2,
        "problem": 0,
        "length": 5,
        "images": [
          "stimuli/0/3/0.png",
          "stimuli/0/3/0.gif",
          "stimuli/0/3/1.gif",
          "stimuli/0/3/2.gif",
          "stimuli/0/3/3.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8],
        "name": "problem_0_4",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 1,
        "problem": 0,
        "length": 8,
        "images": [
          "stimuli/0/4/0.png",
          "stimuli/0/4/0.gif",
          "stimuli/0/4/1.gif",
          "stimuli/0/4/2.gif",
          "stimuli/0/4/3.gif",
          "stimuli/0/4/4.gif",
          "stimuli/0/4/5.gif",
          "stimuli/0/4/6.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7],
        "name": "problem_1_1",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 0,
        "problem": 1,
        "length": 7,
        "images": [
          "stimuli/1/1/0.png",
          "stimuli/1/1/0.gif",
          "stimuli/1/1/1.gif",
          "stimuli/1/1/2.gif",
          "stimuli/1/1/3.gif",
          "stimuli/1/1/4.gif",
          "stimuli/1/1/5.gif"  
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7],
        "name": "problem_1_2",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 1,
        "problem": 1,
        "length": 7,
        "images": [
          "stimuli/1/2/0.png",
          "stimuli/1/2/0.gif",
          "stimuli/1/2/1.gif",
          "stimuli/1/2/2.gif",
          "stimuli/1/2/3.gif",
          "stimuli/1/2/4.gif",
          "stimuli/1/2/5.gif"  
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7],
        "name": "problem_1_3",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 3,
        "problem": 1,
        "length": 7,
        "images": [
          "stimuli/1/3/0.png",
          "stimuli/1/3/0.gif",
          "stimuli/1/3/1.gif",
          "stimuli/1/3/2.gif",
          "stimuli/1/3/3.gif",
          "stimuli/1/3/4.gif",
          "stimuli/1/3/5.gif"  
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6],
        "name": "problem_1_4",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 2,
        "problem": 1,
        "length": 6,
        "images": [
          "stimuli/1/4/0.png",
          "stimuli/1/4/0.gif",
          "stimuli/1/4/1.gif",
          "stimuli/1/4/2.gif",
          "stimuli/1/4/3.gif",
          "stimuli/1/4/4.gif" 
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8,9,10,11,12,13],
        "name": "problem_2_1",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 1,
        "problem": 2,
        "length": 13,
        "images": [
          "stimuli/2/1/0.png",
          "stimuli/2/1/0.gif",
          "stimuli/2/1/1.gif",
          "stimuli/2/1/2.gif",
          "stimuli/2/1/3.gif",
          "stimuli/2/1/4.gif", 
          "stimuli/2/1/5.gif",
          "stimuli/2/1/6.gif",
          "stimuli/2/1/7.gif",
          "stimuli/2/1/8.gif",
          "stimuli/2/1/9.gif", 
          "stimuli/2/1/10.gif",
          "stimuli/2/1/11.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8,9,10],
        "name": "problem_2_2",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 4,
        "problem": 2,
        "length": 10,
        "images": [
          "stimuli/2/2/0.png",
          "stimuli/2/2/0.gif",
          "stimuli/2/2/1.gif",
          "stimuli/2/2/2.gif",
          "stimuli/2/2/3.gif",
          "stimuli/2/2/4.gif", 
          "stimuli/2/2/5.gif",
          "stimuli/2/2/6.gif",
          "stimuli/2/2/7.gif",
          "stimuli/2/2/8.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8,9,10],
        "name": "problem_2_3",
        "optimal": true,
        "goal_space": ["ear", "reap", "pear", "wade", "draw"],
        "goal": 1,
        "problem": 2,
        "length": 10,
        "images": [
          "stimuli/2/3/0.png",
          "stimuli/2/3/0.gif",
          "stimuli/2/3/1.gif",
          "stimuli/2/3/2.gif",
          "stimuli/2/3/3.gif",
          "stimuli/2/3/4.gif", 
          "stimuli/2/3/5.gif",
          "stimuli/2/3/6.gif",
          "stimuli/2/3/7.gif",
          "stimuli/2/3/8.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8],
        "name": "problem_2_4",
        "optimal": true,
        "goal_space": ["wad", "reap", "war", "wade", "draw"],
        "goal": 4,
        "problem": 2,
        "length": 8,
        "images": [
          "stimuli/2/4/0.png",
          "stimuli/2/4/0.gif",
          "stimuli/2/4/1.gif",
          "stimuli/2/4/2.gif",
          "stimuli/2/4/3.gif",
          "stimuli/2/4/4.gif", 
          "stimuli/2/4/5.gif",
          "stimuli/2/4/6.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6],
        "name": "problem_3_1",
        "optimal": true,
        "goal_space": ["cower", "war", "wear", "crow", "core"],
        "goal": 1,
        "problem": 3,
        "length": 6,
        "images": [
          "stimuli/3/1/0.png",
          "stimuli/3/1/0.gif",
          "stimuli/3/1/1.gif",
          "stimuli/3/1/2.gif",
          "stimuli/3/1/3.gif",
          "stimuli/3/1/4.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8,9,10],
        "name": "problem_3_2",
        "optimal": true,
        "goal_space": ["cower", "war", "wear", "crow", "core"],
        "goal": 0,
        "problem": 3,
        "length": 10,
        "images": [
          "stimuli/3/2/0.png",
          "stimuli/3/2/0.gif",
          "stimuli/3/2/1.gif",
          "stimuli/3/2/2.gif",
          "stimuli/3/2/3.gif",
          "stimuli/3/2/4.gif",
          "stimuli/3/2/5.gif",
          "stimuli/3/2/6.gif",
          "stimuli/3/2/7.gif",
          "stimuli/3/2/8.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8,9],
        "name": "problem_3_3",
        "optimal": true,
        "goal_space": ["cower", "war", "wear", "crow", "core"],
        "goal": 4,
        "problem": 3,
        "length": 9,
        "images": [
          "stimuli/3/3/0.png",
          "stimuli/3/3/0.gif",
          "stimuli/3/3/1.gif",
          "stimuli/3/3/2.gif",
          "stimuli/3/3/3.gif",
          "stimuli/3/3/4.gif",
          "stimuli/3/3/5.gif",
          "stimuli/3/3/6.gif",
          "stimuli/3/3/7.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8,9,10],
        "name": "problem_3_4",
        "optimal": true,
        "goal_space": ["cower", "war", "wear", "crow", "core"],
        "goal": 3,
        "problem": 3,
        "length": 10,
        "images": [
          "stimuli/3/4/0.png",
          "stimuli/3/4/0.gif",
          "stimuli/3/4/1.gif",
          "stimuli/3/4/2.gif",
          "stimuli/3/4/3.gif",
          "stimuli/3/4/4.gif",
          "stimuli/3/4/5.gif",
          "stimuli/3/4/6.gif",
          "stimuli/3/4/7.gif",
          "stimuli/3/4/8.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5],
        "name": "problem_4_1",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 3,
        "problem": 4,
        "length": 5,
        "images": [
          "stimuli/4/1/0.png",
          "stimuli/4/1/0.gif",
          "stimuli/4/1/1.gif",
          "stimuli/4/1/2.gif",
          "stimuli/4/1/3.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4],
        "name": "problem_4_2",
        "optimal": true,
        "goal_space": ["raw", "paw", "draw", "war", "wear"],
        "goal": 2,
        "problem": 4,
        "length": 4,
        "images": [
          "stimuli/4/2/0.png",
          "stimuli/4/2/0.gif",
          "stimuli/4/2/1.gif",
          "stimuli/4/2/2.gif",
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4],
        "name": "problem_4_3",
        "optimal": true,
        "goal_space": ["ear", "paw", "dear", "war", "wear"],
        "goal": 4,
        "problem": 4,
        "length": 4,
        "images": [
          "stimuli/4/3/0.png",
          "stimuli/4/3/0.gif",
          "stimuli/4/3/1.gif",
          "stimuli/4/3/2.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4],
        "name": "problem_4_4",
        "optimal": true,
        "goal_space": ["raw", "paw", "draw", "war", "wear"],
        "goal": 4,
        "problem": 4,
        "length": 4,
        "images": [
          "stimuli/4/4/0.png",
          "stimuli/4/4/0.gif",
          "stimuli/4/4/1.gif",
          "stimuli/4/4/2.gif"
        ]
      },
    ];
  }
)

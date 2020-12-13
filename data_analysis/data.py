import json
import pandas as pd
import numpy as np
import csv




with open('plinf-abdee-export.json') as file:
    data = json.load(file)
results = data['results']

assignemnts_data = pd.read_csv("Batch_4270661_batch_results.csv", header=0)
assignemnts_data_2 = pd.read_csv("Batch_4270670_batch_results.csv", header=0)
id_list = np.append(assignemnts_data['Answer.experimentcode'].values, assignemnts_data_2['Answer.experimentcode'].values)
id_list = list(map(str, id_list))
workers_dict = dict.fromkeys(id_list, 0)
exp_dict = dict()
possibly_reject = []

rejected =[1607115047337,
1607115070015,
1607115116358,
1607115480159,
1607115552593,
1607116558958,
1607117474340,
1607117492816,
1607125963924,
1607116912260,
1607115323722,
1607120548427,
1607126650608,
1607117907163,
1607118854103,
1607115018235,
1607117830583,
1607117440250,
1607115873532,
1607121165107,
1607117172687,
1607116510666
]




ids_dict = dict.fromkeys(id_list, 0)
for key, entry in results.items():
    key = key.split("_")
    current_id = key[0]
    if current_id not in ids_dict.keys(): 
        continue
    if ids_dict[current_id] == 0: 
        ids_dict[current_id] = {}
    if len(key) == 2: #the entry is tutorial
        ids_dict[current_id]['tutorial'] = entry
    else:
        exp = "_".join(key[-2:])
        ids_dict[current_id][exp] = entry
        



# primary key is problem number, secondary key is timestep, values are list of dictionaries with keys column_order and additional user_id column
predictions_dict = dict()
column_order = ['goal_probs_0', 'goal_probs_1','goal_probs_2','goal_probs_3','goal_probs_4','true_goal_probs','time_spent','reward_score']
averaged_columns = ['goal_probs_0', 'goal_probs_1','goal_probs_2','goal_probs_3','goal_probs_4','true_goal_probs','time_spent']

workers_dict = dict.fromkeys(id_list, 0)
exp_dict = dict()

for key, entry in results.items():
    key = key.split("_")
    current_id = key[0]
    if current_id not in workers_dict.keys(): 
        continue 
    if workers_dict[current_id] == 0: 
        workers_dict[current_id] = {'reward_score': 0, 'min_time': 1000000, 'default': False}
    if len(key) == 2: #the entry is tutorial
        workers_dict[current_id]['tutorial_final_prob'] = entry[-1]['true_goal_probs']  
    else: #the entry is an experiment
        exp = "_".join(key[-2:])
        if exp in exp_dict.keys(): 
            exp_dict[exp].append(current_id)
        else: 
            exp_dict[exp] = [current_id]
        workers_dict[current_id]['reward_score'] += entry[-1]['reward_score']/entry[-1]['timestep']
        time = []
        for step in entry: 
            time.append(step['time_spent'])
        if min(time) < workers_dict[current_id]['min_time'] and min(time) != 0: 
            workers_dict[current_id]['min_time'] = min(time)
        if [entry[-1]['goal_probs_0'], entry[-1]['goal_probs_1'], 
            entry[-1]['goal_probs_2'], entry[-1]['goal_probs_3'], 
            entry[-1]['goal_probs_4']] == [0.2,0.2,0.2,0.2,0.2]: 
            workers_dict[current_id]['default'] = True
        # build prediction if user not rejected
        if int(current_id) in rejected:
            print(current_id)
            continue
        predictions_dict[exp] = predictions_dict.get(exp, dict())
        for timestep in entry:
            time = timestep['timestep']
            step = {}
            # skip tutorial or bad timestep
            if timestep['time_spent'] == 0:
                continue
            for column in column_order:
                step[column] = round(timestep[column],2)
            step['user_id'] = current_id
            predictions_dict[exp][time] = predictions_dict[exp].get(time, [])
            predictions_dict[exp][time].append(step)
# build averaged dictionary
avg_dict = dict()
for exp in predictions_dict:
    avg_dict[exp] = []
    for time in predictions_dict[exp]:
        timestep_average = dict()
        for result in predictions_dict[exp][time]:
            for column in averaged_columns:
                timestep_average[column] = timestep_average.get(column, 0)
                timestep_average[column] += result[column]
            timestep_average["timestep"] = time
        for column in averaged_columns:
            timestep_average[column] =  round(timestep_average[column]/len(predictions_dict[exp][time]), 4)
        avg_dict[exp].append(timestep_average)


#flagging workers
flagged_ids = []
for key, worker in workers_dict.items(): 
    if worker['min_time'] < 2.0 or worker['tutorial_final_prob'] < 0.7 or worker['default']: 
        worker['flag'] = True
        flagged_ids.append(key)
    else: 
        worker['flag'] = False


#counting experiments
exp_counter = {}
for key, exp in exp_dict.items(): 
    exp_counter[key] = {}
    exp_counter[key]['total'] = len(exp)
    intersection = list(set(exp) & set(flagged_ids)) 
    exp_counter[key]['possibly_rejected'] = len(intersection)
    
    

exp_df = pd.DataFrame.from_dict(exp_counter, orient='index', dtype=None, columns=None)
exp_df


workers_df = pd.DataFrame.from_dict(workers_dict, orient='index', dtype=None, columns=None)
workers_df


ids_dict[flagged_ids[0]]


with open('dict_by_id.json', 'w') as fp:
    json.dump(ids_dict, fp)


# # writing timestep data
# column_order.append('user_id')
# for problem in predictions_dict:
#     problem_data = predictions_dict[problem]
#     for step in problem_data:
#         step_data = problem_data[step]
#         csv_file = str(problem)+"_step_"+str(step)+'_probs.csv'
#         try:
#             with open(csv_file, 'w') as csvfile:
#                 writer = csv.DictWriter(csvfile, fieldnames=column_order)
#                 writer.writeheader()
#                 for data in step_data:
#                     writer.writerow(data)
#         except IOError:
#             print("I/O error")

# writing averaged timestep data
averaged_columns.append('timestep')
for problem in avg_dict:
    csv_file = str(problem)+"_average_probs.csv"
    problem_data = avg_dict[problem]
    try:
        with open(csv_file, 'w') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=averaged_columns)
            writer.writeheader()
            for data in problem_data:
                writer.writerow(data)
    except IOError:
        print("I/O error")



exp_df.to_csv(path_or_buf='experiments_data.csv')







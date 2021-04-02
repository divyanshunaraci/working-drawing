import os


def testing(j_object):
    diff_x = 0
    diff_y = 0
    print(j_object)
    for items in j_object:
        print(items[0][0])
        print(items[1][0])
        if(items[0][0] != items[1][0]):
            diff_x = 1
        if(items[0][1] != items[1][1]):
            diff_y = 1
    # Check for all the components
    if diff_x == 1 and diff_y == 1:
        print('return 1')
        return 1
    else:
        return 0

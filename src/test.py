def work(a):
	for i in range(5, a, 3):
		if i /5 == 1:
			continue
		if i == 17:
			break
		print(i)
	return "ok"
print(work(20))
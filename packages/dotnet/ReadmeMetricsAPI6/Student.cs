namespace ReadmeMetricsAPI6
{
    public class Student
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string City { get; set; }

        public Student(int id, string name, string city)
        {
            Id = id;
            Name = name;
            City = city;
        }

        public Student()
        {
        }
    }
}


using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RequestResponseLoggingMiddlewareAPI
{
    public class Employee
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Country { get; set; }
        public DateTime DoB { get; set; }

        public Employee(int id, string name, string country, DateTime dob)
        {
            Id = id;
            Name = name;
            Country = country;
            DoB = dob;
        }

        public Employee()
        {
        }
    }
}

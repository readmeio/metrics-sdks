using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;

namespace ReadmeMetricsAPI5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StudentController : ControllerBase
    {
        List<Student> stdList = new List<Student>()
        {
            new Student(){ Id = 221, Name = "Jack", City = "New York"},
            new Student(){ Id = 222, Name = "Jacob", City = "Los Angeles"},
            new Student(){ Id = 223, Name = "Theodore", City = "Chicago"}
        };

        //get all
        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(stdList);
        }

        //get by id
        [HttpGet("{id}")]
        public IActionResult GetStudentById([FromRoute] int id)
        {
            var emp = stdList.FirstOrDefault(e => e.Id == id);
            if (emp == null)
            {
                return NotFound();
            }
            return Ok(emp);
        }

        //post
        [HttpPost]
        public IActionResult AddStudent([FromBody] Student Student)
        {
            stdList.Add(Student);
            return Ok(stdList);
        }

        //put is used to update all fields of Student
        [HttpPut("{id}")]
        public IActionResult UpdateStudent([FromRoute] int id, [FromBody] Student Student)
        {
            return Ok(new Student(id, Student.Name, Student.City));
        }

        //delete
        [HttpDelete("{id}")]
        public IActionResult DeleteStudent([FromRoute] int id)
        {
            var emp = stdList.SingleOrDefault(e => e.Id == id);
            stdList.Remove(emp);
            return Ok(stdList);
        }
    }
}

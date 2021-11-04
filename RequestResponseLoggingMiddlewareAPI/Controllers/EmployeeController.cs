using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RequestResponseLoggingMiddlewareAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        List<Employee> empList = new List<Employee>()
        {
            new Employee(){ Id = 111, Name = "aslam", DoB = new DateTime(2081,11,20), Country = "Pakistan"},
            new Employee(){ Id = 222, Name = "nadeem", DoB = new DateTime(1997,01,12), Country = "USA"},
            new Employee(){ Id = 333, Name = "anwar", DoB = new DateTime(2008,04,10), Country = "Iran"},
            new Employee(){ Id = 444, Name = "nawaz", DoB = new DateTime(2001,12,29), Country = "Sri Lanka"}
        };

        //get all
        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(empList);
        }

        //get by id
        [HttpGet("{id}")]
        public IActionResult GetEmployeeById([FromRoute] int id)
        {
            var emp = empList.FirstOrDefault(e => e.Id == id);
            if(emp == null)
            {
                return NotFound();
            }
            return Ok(emp);
        }

        //post
        [HttpPost]
        public IActionResult AddEmployee([FromBody] Employee employee)
        {
            empList.Add(employee);
            return Ok(empList);
        }

        //put is used to update all fields of employee
        [HttpPut("{id}")]
        public IActionResult UpdateEmployee([FromQuery] int id, [FromBody] Employee employee)
        {
            empList.Where(e => e.Id == id).Select(m => { m.Name = employee.Name; m.Country = employee.Country; return m; }).ToList();
            return Ok(empList);
        }

        //delete
        [HttpDelete("{id}")]
        public IActionResult DeleteEmployee([FromRoute] int id)
        {
            var emp = empList.SingleOrDefault(e => e.Id == id);
            empList.Remove(emp);
            return Ok(empList);
        }


    }
}

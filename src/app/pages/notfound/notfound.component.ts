import { Component, OnInit } from '@angular/core';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { TitleService } from 'src/app/core/services/title.service';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.scss'],
})
export class NotFoundComponent implements OnInit {
  public icons = { search: faSearch };
  constructor(private title: TitleService) {}

  public ngOnInit(): void {
    this.title.set('404 Not Found');
  }
}
